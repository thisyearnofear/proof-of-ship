use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    sysvar::instructions as ix_sysvar,
};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use std::str::FromStr;

declare_id!("14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K");

const ED25519_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    0x06, 0xa7, 0xd5, 0x2d, 0x60, 0x2f, 0x92, 0x28,
    0x9b, 0x7e, 0x6f, 0x3a, 0xe9, 0x53, 0x57, 0x52,
    0x01, 0x31, 0x25, 0x39, 0x27, 0x63, 0x21, 0x4e,
    0x41, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

// ── Space constants ──────────────────────────────────────────────
// All Vec and String fields are bounded so the account fits in a
// single Solana allocation (well under 10 KB).

const MAX_HACKATHON_IDS: usize = 10;
const MAX_GITHUB_URL_LEN: usize = 200;
const MAX_PROJECT_NAME_LEN: usize = 32;  // Solana PDA seed limit (32 bytes max)
const MAX_MILESTONES: usize = 20;
const MAX_MILESTONE_DESC_LEN: usize = 200;
const MAX_BACKINGS: usize = 50;
const MAX_SNS_DOMAIN_LEN: usize = 64;
const SNS_NAME_HEADER_LEN: usize = 96;
const SNS_IDENTITY_SIGNATURE_LEN: usize = 64;
const ED25519_HEADER_LEN: usize = 16;
const ED25519_PUBKEY_OFFSET: usize = 16;
const ED25519_SIGNATURE_OFFSET: usize = 48;
const ED25519_MESSAGE_OFFSET: usize = 112;

// Milestone: 4 (String len prefix) + desc + 8 (amount) + 1 (completed) + 8 (completed_at)
const MILESTONE_SIZE: usize = 4 + MAX_MILESTONE_DESC_LEN + 8 + 1 + 8;
// Backing: 32 (backer Pubkey) + 8 (amount) + 8 (multiplier) + 1 (claimed)
const BACKING_SIZE: usize = 32 + 8 + 8 + 1;

const PROJECT_SIZE: usize = 8  // discriminator
    + 32  // developer
    + 32  // verifier
    + 4 + MAX_SNS_DOMAIN_LEN         // builder_sns_domain
    + 32  // builder_sns_name_account
    + 4 + SNS_IDENTITY_SIGNATURE_LEN // builder_identity_signature
    + 4 + (8 * MAX_HACKATHON_IDS)  // hackathon_ids  (Vec length prefix + elements)
    + 4 + MAX_GITHUB_URL_LEN       // github_url     (String length prefix + bytes)
    + 4 + MAX_PROJECT_NAME_LEN     // name           (String length prefix + bytes)
    + 8   // funding_amount
    + 1   // is_active
    + 8   // funded_at
    + 1   // milestones_completed
    + 1   // milestones_count
    + 4 + (MILESTONE_SIZE * MAX_MILESTONES)  // milestones
    + 4 + (BACKING_SIZE * MAX_BACKINGS)       // backings
    + 8;  // total_backing

const CREDIT_LINE_SIZE: usize = 8  // discriminator
    + 32  // developer
    + 8   // total_amount
    + 8   // used_amount
    + 8   // reputation
    + 1   // is_active
    + 8;  // last_updated

// ── Program ──────────────────────────────────────────────────────

#[program]
pub mod blockchain_solana {
    use super::*;

    /// One-time setup: create the protocol treasury ATA so repay_loan has
    /// somewhere to send USDC that isn't the project's milestone vault.
    ///
    /// NOTE: Treasury funds are currently locked — no withdraw instruction exists yet.
    /// A `withdraw_treasury` instruction should be added before mainnet to allow
    /// the protocol authority to reclaim accumulated repayments.
    pub fn initialize_treasury(_ctx: Context<InitializeTreasury>) -> Result<()> {
        Ok(())
    }

    pub fn request_funding(
        ctx: Context<RequestFunding>,
        hackathon_ids: Vec<u64>,
        github_url: String,
        project_name: String,
        milestone_descriptions: Vec<String>,
        milestone_amounts: Vec<u64>,
        verifier: Pubkey,
        builder_sns_domain: String,
        builder_identity_signature: Vec<u8>,
    ) -> Result<()> {
        // ── Input validation against allocated space ──────────────
        require!(
            hackathon_ids.len() <= MAX_HACKATHON_IDS,
            ErrorCode::TooManyHackathonIds
        );
        require!(
            github_url.len() <= MAX_GITHUB_URL_LEN,
            ErrorCode::GithubUrlTooLong
        );
        require!(
            project_name.len() <= MAX_PROJECT_NAME_LEN,
            ErrorCode::ProjectNameTooLong
        );
        require!(
            builder_sns_domain.len() <= MAX_SNS_DOMAIN_LEN,
            ErrorCode::SnsDomainTooLong
        );
        require!(
            builder_sns_domain.ends_with(".sol"),
            ErrorCode::InvalidSnsDomain
        );
        require!(
            milestone_descriptions.len() <= MAX_MILESTONES
                && milestone_amounts.len() <= MAX_MILESTONES,
            ErrorCode::TooManyMilestones
        );
        require!(
            milestone_descriptions.len() == milestone_amounts.len(),
            ErrorCode::MilestoneCountMismatch
        );
        require!(
            builder_identity_signature.len() == SNS_IDENTITY_SIGNATURE_LEN,
            ErrorCode::InvalidIdentitySignature
        );
        for desc in &milestone_descriptions {
            require!(
                desc.len() <= MAX_MILESTONE_DESC_LEN,
                ErrorCode::MilestoneDescriptionTooLong
            );
        }

        let project = &mut ctx.accounts.project;
        let credit_line = &mut ctx.accounts.credit_line;
        let developer = &ctx.accounts.developer;
        let sns_name_account = &ctx.accounts.sns_name_account;

        validate_sns_name_account(sns_name_account, &developer.key())?;
        let identity_message = build_identity_claim_message(
            &developer.key(),
            &sns_name_account.key(),
            &builder_sns_domain,
            &project_name,
            &github_url,
        );
        verify_ed25519_identity_proof(
            &ctx.accounts.instructions_sysvar,
            &developer.key(),
            &builder_identity_signature,
            &identity_message,
        )?;

        // Checked summation of milestone amounts
        let mut total_amount: u64 = 0;
        for amount in milestone_amounts.iter() {
            total_amount = total_amount
                .checked_add(*amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
        }

        // Initialize project
        project.developer = developer.key();
        project.verifier = verifier;
        project.builder_sns_domain = builder_sns_domain;
        project.builder_sns_name_account = sns_name_account.key();
        project.builder_identity_signature = builder_identity_signature;
        project.hackathon_ids = hackathon_ids;
        project.github_url = github_url;
        project.name = project_name;
        project.funding_amount = total_amount;
        project.is_active = true;
        project.funded_at = Clock::get()?.unix_timestamp;
        project.milestones_count = milestone_amounts.len() as u8;
        project.milestones_completed = 0;

        project.milestones = milestone_descriptions
            .iter()
            .zip(milestone_amounts.iter())
            .map(|(desc, amt)| Milestone {
                description: desc.clone(),
                amount: *amt,
                completed: false,
                completed_at: 0,
            })
            .collect();

        project.backings = Vec::new();
        project.total_backing = 0;

        // Initialize or update credit line
        if credit_line.last_updated == 0 {
            credit_line.developer = developer.key();
            credit_line.reputation = 400; // Default min score
            credit_line.total_amount = 5000 * 1_000_000; // Simplified max: 5 000 USDC
            credit_line.used_amount = total_amount;
            credit_line.is_active = true;
        } else {
            let new_used = credit_line
                .used_amount
                .checked_add(total_amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
            require!(new_used <= credit_line.total_amount, ErrorCode::CreditLimitExceeded);
            credit_line.used_amount = new_used;
        }
        credit_line.last_updated = Clock::get()?.unix_timestamp;

        // vault_token_account is created via init_if_needed in the accounts
        // struct — owned by the vault_authority PDA, ready to receive USDC.

        Ok(())
    }

    pub fn back_project(
        ctx: Context<BackProject>,
        multiplier: u64,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let backer = &ctx.accounts.backer;

        // Project must be active
        require!(project.is_active, ErrorCode::ProjectInactive);

        // Multiplier must be 100..=500 (1× to 5×).
        require!(multiplier >= 100 && multiplier <= 500, ErrorCode::InvalidMultiplier);

        // Guard against Vec overflow
        require!(
            project.backings.len() < MAX_BACKINGS,
            ErrorCode::MaxBackingsReached
        );

        // Transfer USDC from backer → vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.backer_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: backer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Record backing
        project.backings.push(Backing {
            backer: backer.key(),
            amount,
            multiplier,
            claimed: false,
        });

        project.total_backing = project
            .total_backing
            .checked_add(amount)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Boost developer credit line by 2× the backing amount
        let credit_line = &mut ctx.accounts.developer_credit_line;
        let boost = amount
            .checked_mul(2)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        credit_line.total_amount = credit_line
            .total_amount
            .checked_add(boost)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        Ok(())
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, amount: u64) -> Result<()> {
        let credit_line = &mut ctx.accounts.credit_line;
        let developer = &ctx.accounts.developer;

        // Validate that the repayment is for the correct project
        require_keys_eq!(
            ctx.accounts.project.developer,
            developer.key(),
            ErrorCode::UnauthorizedDeveloper
        );

        // Transfer USDC from developer → protocol treasury (NOT the project vault)
        let cpi_accounts = Transfer {
            from: ctx.accounts.developer_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: developer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        credit_line.used_amount = credit_line
            .used_amount
            .checked_sub(amount)
            .ok_or(ErrorCode::ArithmeticUnderflow)?;

        // Repayment incentive: +1 reputation per 100 USDC repaid
        let rep_gain = amount / (100 * 1_000_000);
        if rep_gain > 0 {
            credit_line.reputation = credit_line
                .reputation
                .checked_add(rep_gain)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
            if credit_line.reputation > 850 {
                credit_line.reputation = 850;
            }
        }

        credit_line.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn verify_milestone(
        ctx: Context<VerifyMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        // Project must be active for milestone payouts
        require!(project.is_active, ErrorCode::ProjectInactive);

        // Ensure signer is the authorized verifier
        require_keys_eq!(
            ctx.accounts.verifier.key(),
            project.verifier,
            ErrorCode::UnauthorizedVerifier
        );

        // Bounds check
        if milestone_index as usize >= project.milestones.len() {
            return Err(ErrorCode::InvalidMilestoneIndex.into());
        }

        if project.milestones[milestone_index as usize].completed {
            return Err(ErrorCode::MilestoneAlreadyCompleted.into());
        }

        // Capture payout amount before mutating
        let payout_amount = project.milestones[milestone_index as usize].amount;

        // Update milestone + counters
        project.milestones[milestone_index as usize].completed = true;
        project.milestones[milestone_index as usize].completed_at = Clock::get()?.unix_timestamp;
        project.milestones_completed = project
            .milestones_completed
            .checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Payout to developer from the project vault
        let project_key = project.key();
        let seeds = &[
            b"vault_authority",
            project_key.as_ref(),
            &[ctx.bumps.vault_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.developer_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, payout_amount)?;

        // Auto-close project when all milestones are paid out.
        // NOTE: claim_reward works on inactive projects (by design — backers must always
        // be able to reclaim). If milestone payouts drain the vault before backers claim,
        // the vault will be insolvent for multiplier-weighted claims. The front-end should
        // enforce claim-before-payout ordering, or a separate escrow model is needed.
        if project.milestones_completed >= project.milestones_count {
            project.is_active = false;
        }

        Ok(())
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        backing_index: u32,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let backer = &ctx.accounts.backer;

        if backing_index as usize >= project.backings.len() {
            return Err(ErrorCode::InvalidBackingIndex.into());
        }

        let backing = &mut project.backings[backing_index as usize];

        require_keys_eq!(
            backing.backer,
            backer.key(),
            ErrorCode::UnauthorizedBacker
        );

        if backing.claimed {
            return Err(ErrorCode::BackingAlreadyClaimed.into());
        }

        // NOTE: claim_reward works even if project.is_active == false.
        // Backers must always be able to reclaim their stake + earned rewards,
        // regardless of project status. This is intentional.

        // Apply the stored multiplier:
        //   multiplier 100 = 1×, 150 = 1.5×, 200 = 2×, etc.
        let reward_amount = backing
            .amount
            .checked_mul(backing.multiplier)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        backing.claimed = true;

        // Payout to backer from the project vault
        let project_key = project.key();
        let seeds = &[
            b"vault_authority",
            project_key.as_ref(),
            &[ctx.bumps.vault_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.backer_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, reward_amount)?;

        Ok(())
    }
}

// ── Account structs ──────────────────────────────────────────────

/// One-time setup: create the protocol treasury ATA.
/// Permissionless — any signer can call this because `init_if_needed` is idempotent
/// (repeated calls are no-ops once the ATA exists). The first caller pays for ATA creation.
#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    /// CHECK: Protocol treasury PDA — seeds ensure only this program derives it.
    #[account(seeds = [b"treasury"], bump)]
    pub treasury_authority: AccountInfo<'info>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_authority,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(hackathon_ids: Vec<u64>, github_url: String, project_name: String)]
pub struct RequestFunding<'info> {
    #[account(
        init,
        payer = developer,
        space = PROJECT_SIZE,
        seeds = [b"project", developer.key().as_ref(), project_name.as_bytes()],
        bump,
    )]
    pub project: Account<'info, Project>,

    #[account(
        init_if_needed,
        payer = developer,
        space = CREDIT_LINE_SIZE,
        seeds = [b"credit_line", developer.key().as_ref()],
        bump,
    )]
    pub credit_line: Account<'info, CreditLine>,

    /// CHECK: PDA authority for the project's USDC vault.
    /// Derived from the project key so each project gets its own vault authority.
    #[account(
        seeds = [b"vault_authority", project.key().as_ref()],
        bump,
    )]
    pub vault_authority: AccountInfo<'info>,

    /// USDC mint — all token accounts in this instruction must use this mint.
    pub usdc_mint: Account<'info, Mint>,

    /// Project vault: ATA of vault_authority for usdc_mint.
    /// Created here so back_project / verify_milestone / claim_reward can assume it exists.
    #[account(
        init_if_needed,
        payer = developer,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault_authority,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub developer: Signer<'info>,

    /// CHECK: SNS name account header is validated manually:
    /// - account owner must be the SNS name program
    /// - parent name must be the `.sol` root domain
    /// - registry owner must match the developer signer
    pub sns_name_account: AccountInfo<'info>,

    /// CHECK: Instructions sysvar used to verify the preceding Ed25519 proof instruction.
    #[account(address = ix_sysvar::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct BackProject<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [b"credit_line", project.developer.as_ref()],
        bump,
    )]
    pub developer_credit_line: Account<'info, CreditLine>,

    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(
        mut,
        constraint = backer_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = backer_token_account.owner == backer.key()
            @ ErrorCode::InvalidTokenAccountOwner,
    )]
    pub backer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = vault_token_account.owner == vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the project's USDC vault
    #[account(
        seeds = [b"vault_authority", project.key().as_ref()],
        bump,
    )]
    pub vault_authority: AccountInfo<'info>,

    /// USDC mint — validates that both token accounts are USDC
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        seeds = [b"credit_line", developer.key().as_ref()],
        bump,
    )]
    pub credit_line: Account<'info, CreditLine>,

    #[account(mut)]
    pub developer: Signer<'info>,

    #[account(
        mut,
        constraint = developer_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = developer_token_account.owner == developer.key()
            @ ErrorCode::InvalidTokenAccountOwner,
    )]
    pub developer_token_account: Account<'info, TokenAccount>,

    /// Protocol treasury — repayments flow here, not back into the
    /// project's milestone vault.
    #[account(
        mut,
        constraint = treasury_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = treasury_token_account.owner == treasury_authority.key()
            @ ErrorCode::InvalidTreasuryOwner,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// CHECK: Protocol treasury PDA authority
    #[account(seeds = [b"treasury"], bump)]
    pub treasury_authority: AccountInfo<'info>,

    /// Project account is read-only here — needed only so the client
    /// can identify which credit line to repay.
    pub project: Account<'info, Project>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct VerifyMilestone<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        constraint = developer_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = developer_token_account.owner == project.developer
            @ ErrorCode::InvalidTokenAccountOwner,
    )]
    pub developer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = vault_token_account.owner == vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the project's USDC vault
    #[account(
        seeds = [b"vault_authority", project.key().as_ref()],
        bump,
    )]
    pub vault_authority: AccountInfo<'info>,

    pub verifier: Signer<'info>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,

    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(
        mut,
        constraint = backer_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = backer_token_account.owner == backer.key()
            @ ErrorCode::InvalidTokenAccountOwner,
    )]
    pub backer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = vault_token_account.owner == vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the project's USDC vault
    #[account(
        seeds = [b"vault_authority", project.key().as_ref()],
        bump,
    )]
    pub vault_authority: AccountInfo<'info>,

    /// USDC mint
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

// ── Error codes ──────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("The signer is not the authorized verifier for this project.")]
    UnauthorizedVerifier,
    #[msg("The milestone has already been completed.")]
    MilestoneAlreadyCompleted,
    #[msg("The milestone index is out of bounds.")]
    InvalidMilestoneIndex,
    #[msg("The backing index is out of bounds.")]
    InvalidBackingIndex,
    #[msg("The signer is not the authorized backer for this backing.")]
    UnauthorizedBacker,
    #[msg("The reward has already been claimed.")]
    BackingAlreadyClaimed,
    #[msg("Arithmetic overflow.")]
    ArithmeticOverflow,
    #[msg("Arithmetic underflow.")]
    ArithmeticUnderflow,
    #[msg("The project is not active.")]
    ProjectInactive,
    #[msg("Maximum number of backings reached for this project.")]
    MaxBackingsReached,
    #[msg("Invalid mint — expected USDC.")]
    InvalidMint,
    #[msg("Token account owner does not match the expected owner.")]
    InvalidTokenAccountOwner,
    #[msg("Vault token account has incorrect owner.")]
    InvalidVaultOwner,
    #[msg("Treasury token account has incorrect owner.")]
    InvalidTreasuryOwner,
    #[msg("Too many hackathon IDs.")]
    TooManyHackathonIds,
    #[msg("GitHub URL exceeds maximum length.")]
    GithubUrlTooLong,
    #[msg("Project name exceeds maximum length.")]
    ProjectNameTooLong,
    #[msg("Too many milestones.")]
    TooManyMilestones,
    #[msg("Milestone descriptions and milestone amounts must have the same length.")]
    MilestoneCountMismatch,
    #[msg("Milestone description exceeds maximum length.")]
    MilestoneDescriptionTooLong,
    #[msg("SNS domain exceeds maximum length.")]
    SnsDomainTooLong,
    #[msg("SNS identity must be a .sol domain.")]
    InvalidSnsDomain,
    #[msg("SNS identity signature must be 64 bytes.")]
    InvalidIdentitySignature,
    #[msg("The SNS name account is not owned by the SNS program.")]
    InvalidSnsNameProgramOwner,
    #[msg("The SNS name account data is invalid.")]
    InvalidSnsNameAccountData,
    #[msg("The SNS name account is not a top-level .sol domain.")]
    InvalidSnsRootDomain,
    #[msg("The connected developer does not own the provided SNS name account.")]
    UnauthorizedSnsOwner,
    #[msg("Missing the preceding Ed25519 identity proof instruction.")]
    MissingIdentityProofInstruction,
    #[msg("The Ed25519 identity proof instruction is malformed or does not match the expected proof.")]
    InvalidIdentityProofInstruction,
    #[msg("The developer is not authorized for this project.")]
    UnauthorizedDeveloper,
    #[msg("Multiplier must be between 100 (1×) and 500 (5×).")]
    InvalidMultiplier,
    #[msg("Credit limit exceeded.")]
    CreditLimitExceeded,
}

// ── Data structs ─────────────────────────────────────────────────

#[account]
pub struct Project {
    pub developer: Pubkey,
    pub verifier: Pubkey,
    pub builder_sns_domain: String,
    pub builder_sns_name_account: Pubkey,
    pub builder_identity_signature: Vec<u8>,
    pub hackathon_ids: Vec<u64>,
    pub github_url: String,
    pub name: String,
    pub funding_amount: u64,
    pub is_active: bool,
    pub funded_at: i64,
    pub milestones_completed: u8,
    pub milestones_count: u8,
    pub milestones: Vec<Milestone>,
    pub backings: Vec<Backing>,
    pub total_backing: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Milestone {
    pub description: String,
    pub amount: u64,
    pub completed: bool,
    pub completed_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Backing {
    pub backer: Pubkey,
    pub amount: u64,
    pub multiplier: u64,
    pub claimed: bool,
}

#[account]
pub struct CreditLine {
    pub developer: Pubkey,
    pub total_amount: u64,
    pub used_amount: u64,
    pub reputation: u64,
    pub is_active: bool,
    pub last_updated: i64,
}

fn sns_name_program_id() -> Pubkey {
    Pubkey::from_str("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX").unwrap()
}

fn sns_root_domain_account() -> Pubkey {
    Pubkey::from_str("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx").unwrap()
}

fn validate_sns_name_account(name_account: &AccountInfo, developer: &Pubkey) -> Result<()> {
    require_keys_eq!(
        *name_account.owner,
        sns_name_program_id(),
        ErrorCode::InvalidSnsNameProgramOwner
    );

    let data = name_account
        .try_borrow_data()
        .map_err(|_| error!(ErrorCode::InvalidSnsNameAccountData))?;
    require!(
        data.len() >= SNS_NAME_HEADER_LEN,
        ErrorCode::InvalidSnsNameAccountData
    );

    let parent_name = Pubkey::new_from_array(
        data[0..32]
            .try_into()
            .map_err(|_| error!(ErrorCode::InvalidSnsNameAccountData))?,
    );
    let owner = Pubkey::new_from_array(
        data[32..64]
            .try_into()
            .map_err(|_| error!(ErrorCode::InvalidSnsNameAccountData))?,
    );

    require_keys_eq!(
        parent_name,
        sns_root_domain_account(),
        ErrorCode::InvalidSnsRootDomain
    );
    require_keys_eq!(owner, *developer, ErrorCode::UnauthorizedSnsOwner);

    Ok(())
}

fn build_identity_claim_message(
    developer: &Pubkey,
    sns_name_account: &Pubkey,
    builder_sns_domain: &str,
    project_name: &str,
    github_url: &str,
) -> Vec<u8> {
    format!(
        "proof-of-ship:sns-identity:v1:{}:{}:{}:{}:{}",
        developer,
        sns_name_account,
        builder_sns_domain,
        project_name,
        github_url
    )
    .into_bytes()
}

fn verify_ed25519_identity_proof(
    instructions_sysvar: &AccountInfo,
    developer: &Pubkey,
    expected_signature: &[u8],
    expected_message: &[u8],
) -> Result<()> {
    let current_ix_index = ix_sysvar::load_current_index_checked(instructions_sysvar)
        .map_err(|_| error!(ErrorCode::MissingIdentityProofInstruction))?;
    require!(
        current_ix_index > 0,
        ErrorCode::MissingIdentityProofInstruction
    );

    let ed25519_ix = ix_sysvar::load_instruction_at_checked(
        (current_ix_index - 1) as usize,
        instructions_sysvar,
    )
    .map_err(|_| error!(ErrorCode::MissingIdentityProofInstruction))?;

    require_keys_eq!(
        ed25519_ix.program_id,
        ED25519_PROGRAM_ID,
        ErrorCode::InvalidIdentityProofInstruction
    );
    require!(
        ed25519_ix.accounts.is_empty(),
        ErrorCode::InvalidIdentityProofInstruction
    );

    let data = ed25519_ix.data;
    require!(
        data.len() >= ED25519_MESSAGE_OFFSET,
        ErrorCode::InvalidIdentityProofInstruction
    );
    require!(data[0] == 1, ErrorCode::InvalidIdentityProofInstruction);

    let read_u16 = |start: usize| -> Result<u16> {
        Ok(u16::from_le_bytes(
            data[start..start + 2]
                .try_into()
                .map_err(|_| error!(ErrorCode::InvalidIdentityProofInstruction))?,
        ))
    };

    let signature_offset = read_u16(2)? as usize;
    let signature_ix_index = read_u16(4)?;
    let pubkey_offset = read_u16(6)? as usize;
    let pubkey_ix_index = read_u16(8)?;
    let message_offset = read_u16(10)? as usize;
    let message_size = read_u16(12)? as usize;
    let message_ix_index = read_u16(14)?;

    require!(
        signature_offset == ED25519_SIGNATURE_OFFSET
            && pubkey_offset == ED25519_PUBKEY_OFFSET
            && message_offset == ED25519_MESSAGE_OFFSET
            && signature_ix_index == u16::MAX
            && pubkey_ix_index == u16::MAX
            && message_ix_index == u16::MAX
            && message_size == expected_message.len(),
        ErrorCode::InvalidIdentityProofInstruction
    );

    require!(
        data.len() >= ED25519_MESSAGE_OFFSET + expected_message.len(),
        ErrorCode::InvalidIdentityProofInstruction
    );

    let expected_pubkey = developer.to_bytes();
    let pubkey_slice = &data[ED25519_PUBKEY_OFFSET..ED25519_SIGNATURE_OFFSET];
    let signature_slice = &data[ED25519_SIGNATURE_OFFSET..ED25519_MESSAGE_OFFSET];
    let message_slice =
        &data[ED25519_MESSAGE_OFFSET..ED25519_MESSAGE_OFFSET + expected_message.len()];

    require!(
        pubkey_slice == expected_pubkey.as_slice()
            && signature_slice == expected_signature
            && message_slice == expected_message,
        ErrorCode::InvalidIdentityProofInstruction
    );

    Ok(())
}
