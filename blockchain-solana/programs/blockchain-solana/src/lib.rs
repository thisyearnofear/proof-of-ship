use anchor_lang::prelude::*;
use anchor_lang::{emit, solana_program::{
    sysvar::instructions as ix_sysvar,
}};
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use std::str::FromStr;

declare_id!("DVzV16mVG9vHdrum9Fx9kGhzRv2GJa2mNnmTWUnKa6st");

const ED25519_PROGRAM_ID: Pubkey = Pubkey::new_from_array([
    0x06, 0xa7, 0xd5, 0x2d, 0x60, 0x2f, 0x92, 0x28,
    0x9b, 0x7e, 0x6f, 0x3a, 0xe9, 0x53, 0x57, 0x52,
    0x01, 0x31, 0x25, 0x39, 0x27, 0x63, 0x21, 0x4e,
    0x41, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

// ── Space constants ──────────────────────────────────────────────

const MAX_HACKATHON_IDS: usize = 10;
const MAX_GITHUB_URL_LEN: usize = 200;
const MAX_PROJECT_NAME_LEN: usize = 32;
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

const MILESTONE_SIZE: usize = 4 + MAX_MILESTONE_DESC_LEN + 8 + 1 + 8;
const BACKING_SIZE: usize = 32 + 8 + 8 + 1;

const PROJECT_SIZE: usize = 8
    + 32
    + 32
    + 4 + MAX_SNS_DOMAIN_LEN
    + 32
    + 4 + SNS_IDENTITY_SIGNATURE_LEN
    + 4 + (8 * MAX_HACKATHON_IDS)
    + 4 + MAX_GITHUB_URL_LEN
    + 4 + MAX_PROJECT_NAME_LEN
    + 8
    + 1
    + 8
    + 1
    + 1
    + 4 + (MILESTONE_SIZE * MAX_MILESTONES)
    + 4 + (BACKING_SIZE * MAX_BACKINGS)
    + 8;

const CREDIT_LINE_SIZE: usize = 8
    + 32
    + 8
    + 8
    + 8
    + 1
    + 8;

// ── Program ──────────────────────────────────────────────────────

#[program]
pub mod blockchain_solana {
    use super::*;

    /// One-time setup: create the protocol treasury ATA.
    /// Treasury holds loan repayments and funds backer multiplier rewards.
    pub fn initialize_treasury(_ctx: Context<InitializeTreasury>) -> Result<()> {
        Ok(())
    }

    /// Withdraw USDC from the protocol treasury.
    /// Only the treasury_authority PDA signer can authorize this.
    /// Currently guarded: no account holds the treasury seed signer.
    /// Add this instruction when a DAO/multisig can control the treasury.
    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        let treasury_key = ctx.accounts.treasury_authority.key();
        let seeds: &[&[u8]] = &[b"treasury", &[ctx.bumps.treasury_authority]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.treasury_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

    /// Fund backer multiplier rewards from the protocol treasury into the
    /// backer escrow vault. This ensures backers get their promised multiplier
    /// payout without competing with milestone funds.
    ///
    /// Callable by any holder of the treasury authority's signer keys
    /// (or by a DAO-controlled process).
    pub fn fund_backer_rewards(ctx: Context<FundBackerRewards>, amount: u64) -> Result<()> {
        let treasury_key = ctx.accounts.treasury_authority.key();
        let seeds: &[&[u8]] = &[b"treasury", &[ctx.bumps.treasury_authority]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.backer_escrow_vault.to_account_info(),
            authority: ctx.accounts.treasury_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;
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
        // Prevent self-verification: the verifier must be a different party
        // than the developer. Otherwise the developer could mark their own
        // milestones as complete without independent review.
        require!(
            verifier != developer.key(),
            ErrorCode::SelfVerificationNotAllowed
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

        let mut total_amount: u64 = 0;
        for amount in milestone_amounts.iter() {
            total_amount = total_amount
                .checked_add(*amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
        }

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

        if credit_line.last_updated == 0 {
            credit_line.developer = developer.key();
            credit_line.reputation = 400;
            credit_line.total_amount = 5000 * 1_000_000;
            credit_line.used_amount = total_amount;
            credit_line.is_active = true;
        } else {
            let new_used = credit_line
                .used_amount
                .checked_add(total_amount)
                .ok_or(ErrorCode::ArithmeticOverflow)?;
            require!(
                new_used <= credit_line.total_amount,
                ErrorCode::CreditLimitExceeded
            );
            credit_line.used_amount = new_used;
        }
        credit_line.last_updated = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn back_project(
        ctx: Context<BackProject>,
        multiplier: u64,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let backer = &ctx.accounts.backer;

        require!(project.is_active, ErrorCode::ProjectInactive);
        require!(
            multiplier >= 100 && multiplier <= 500,
            ErrorCode::InvalidMultiplier
        );
        require!(
            project.backings.len() < MAX_BACKINGS,
            ErrorCode::MaxBackingsReached
        );

        // Transfer USDC from backer → backer_escrow_vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.backer_token_account.to_account_info(),
            to: ctx.accounts.backer_escrow_vault.to_account_info(),
            authority: backer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

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

        let credit_line = &mut ctx.accounts.developer_credit_line;
        let boost = amount
            .checked_mul(2)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
        credit_line.total_amount = credit_line
            .total_amount
            .checked_add(boost)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        emit!(ProjectBacked {
            project: project.key(),
            backer: backer.key(),
            amount,
            multiplier,
            total_backing: project.total_backing,
        });

        Ok(())
    }

    pub fn repay_loan(ctx: Context<RepayLoan>, amount: u64) -> Result<()> {
        let credit_line = &mut ctx.accounts.credit_line;
        let developer = &ctx.accounts.developer;

        require_keys_eq!(
            ctx.accounts.project.developer,
            developer.key(),
            ErrorCode::UnauthorizedDeveloper
        );

        let cpi_accounts = Transfer {
            from: ctx.accounts.developer_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: developer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        credit_line.used_amount = credit_line
            .used_amount
            .checked_sub(amount)
            .ok_or(ErrorCode::ArithmeticUnderflow)?;

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

        emit!(LoanRepaid {
            project: ctx.accounts.project.key(),
            developer: developer.key(),
            amount,
            used_amount: credit_line.used_amount,
            reputation: credit_line.reputation,
        });

        Ok(())
    }

    pub fn verify_milestone(
        ctx: Context<VerifyMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        require!(project.is_active, ErrorCode::ProjectInactive);
        require_keys_eq!(
            ctx.accounts.verifier.key(),
            project.verifier,
            ErrorCode::UnauthorizedVerifier
        );

        if milestone_index as usize >= project.milestones.len() {
            return Err(ErrorCode::InvalidMilestoneIndex.into());
        }
        if project.milestones[milestone_index as usize].completed {
            return Err(ErrorCode::MilestoneAlreadyCompleted.into());
        }

        let payout_amount = project.milestones[milestone_index as usize].amount;

        project.milestones[milestone_index as usize].completed = true;
        project.milestones[milestone_index as usize].completed_at =
            Clock::get()?.unix_timestamp;
        project.milestones_completed = project
            .milestones_completed
            .checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        // Payout from the milestone vault (separate from backer escrow vault).
        let project_key = project.key();
        let seeds = &[
            b"milestone_vault_authority",
            project_key.as_ref(),
            &[ctx.bumps.milestone_vault_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.milestone_vault.to_account_info(),
            to: ctx.accounts.developer_token_account.to_account_info(),
            authority: ctx.accounts.milestone_vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, payout_amount)?;

        if project.milestones_completed >= project.milestones_count {
            project.is_active = false;
        }

        emit!(MilestoneVerified {
            project: project.key(),
            verifier: ctx.accounts.verifier.key(),
            milestone_index,
            payout_amount,
            milestones_completed: project.milestones_completed,
        });

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

        // Always claimable — even after project is inactive.
        // Backer gets their principal from the escrow vault.
        // The multiplier premium must be funded into the escrow vault
        // by the protocol treasury (via fund_backer_rewards) before
        // this instruction is called for the reward portion.
        //
        // If the multiplier premium has NOT been funded, the backer
        // still gets their principal (amount) back — they can always
        // reclaim their stake. The reward portion (multiplier - 100)
        // requires treasury funding.
        //
        // The escrow vault should hold: amount + (amount * (multiplier - 100) / 100)
        // If it only holds amount, the transfer succeeds for just the principal.
        // If funded fully by treasury, the full reward is paid.

        // Capture values before mutation for event emission
        let backing_amount = backing.amount;
        let backing_multiplier = backing.multiplier;

        let reward_amount = backing_amount
            .checked_mul(backing_multiplier)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        backing.claimed = true;

        // Payout from the backer escrow vault (separate from milestone vault).
        let project_key = project.key();
        let seeds = &[
            b"backer_vault_authority",
            project_key.as_ref(),
            &[ctx.bumps.backer_vault_authority],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.backer_escrow_vault.to_account_info(),
            to: ctx.accounts.backer_token_account.to_account_info(),
            authority: ctx.accounts.backer_vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, reward_amount)?;

        emit!(RewardClaimed {
            project: project.key(),
            backer: backer.key(),
            backing_index,
            amount: backing_amount,
            reward_amount,
            multiplier: backing_multiplier,
        });

        Ok(())
    }
}

// ── Account structs ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
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
pub struct WithdrawTreasury<'info> {
    /// CHECK: Protocol treasury PDA. No data read; used only for PDA signing via seeds.
    #[account(seeds = [b"treasury"], bump)]
    pub treasury_authority: AccountInfo<'info>,

    #[account(
        mut,
        constraint = treasury_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = treasury_token_account.owner == treasury_authority.key()
            @ ErrorCode::InvalidTreasuryOwner,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FundBackerRewards<'info> {
    /// CHECK: Protocol treasury PDA.
    #[account(seeds = [b"treasury"], bump)]
    pub treasury_authority: AccountInfo<'info>,

    #[account(
        mut,
        constraint = treasury_token_account.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = treasury_token_account.owner == treasury_authority.key()
            @ ErrorCode::InvalidTreasuryOwner,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// CHECK: Backer escrow vault PDA for the project.
    #[account(
        seeds = [b"backer_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub backer_vault_authority: AccountInfo<'info>,

    #[account(
        mut,
        constraint = backer_escrow_vault.owner == backer_vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
        constraint = backer_escrow_vault.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
    )]
    pub backer_escrow_vault: Account<'info, TokenAccount>,

    /// Project account — used to derive the backer vault PDA.
    pub project: Account<'info, Project>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
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

    /// CHECK: PDA authority for the project's milestone vault.
    /// Milestone vault holds only the milestone funding amounts.
    /// verify_milestone pays out of this vault only.
    #[account(
        seeds = [b"milestone_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub milestone_vault_authority: AccountInfo<'info>,

    /// Milestone vault ATA — holds milestone funding.
    #[account(
        init_if_needed,
        payer = developer,
        associated_token::mint = usdc_mint,
        associated_token::authority = milestone_vault_authority,
    )]
    pub milestone_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the project's backer escrow vault.
    /// Backer escrow vault holds backer stakes separately.
    /// claim_reward pays out of this vault. Multiplier premiums are
    /// funded into this vault by the protocol treasury.
    #[account(
        seeds = [b"backer_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub backer_vault_authority: AccountInfo<'info>,

    /// Backer escrow vault ATA — holds backer stakes.
    #[account(
        init_if_needed,
        payer = developer,
        associated_token::mint = usdc_mint,
        associated_token::authority = backer_vault_authority,
    )]
    pub backer_escrow_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub developer: Signer<'info>,

    pub sns_name_account: AccountInfo<'info>,

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
        constraint = backer_escrow_vault.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = backer_escrow_vault.owner == backer_vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub backer_escrow_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the backer escrow vault
    #[account(
        seeds = [b"backer_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub backer_vault_authority: AccountInfo<'info>,

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

    pub project: Account<'info, Project>,

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
        constraint = milestone_vault.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = milestone_vault.owner == milestone_vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub milestone_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the milestone vault
    #[account(
        seeds = [b"milestone_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub milestone_vault_authority: AccountInfo<'info>,

    pub verifier: Signer<'info>,

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
        constraint = backer_escrow_vault.mint == usdc_mint.key()
            @ ErrorCode::InvalidMint,
        constraint = backer_escrow_vault.owner == backer_vault_authority.key()
            @ ErrorCode::InvalidVaultOwner,
    )]
    pub backer_escrow_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA authority for the backer escrow vault
    #[account(
        seeds = [b"backer_vault_authority", project.key().as_ref()],
        bump,
    )]
    pub backer_vault_authority: AccountInfo<'info>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

// ── Error codes ──────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("The signer is not the authorized verifier for this project.")]
    UnauthorizedVerifier,
    #[msg("Self-verification is not allowed. The verifier must be a different party than the developer.")]
    SelfVerificationNotAllowed,
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
    #[msg("Milestone descriptions and amounts must have the same length.")]
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
    #[msg("Insufficient treasury balance for the requested withdrawal.")]
    InsufficientTreasuryBalance,
}

// ── Events ───────────────────────────────────────────────────────

#[event]
pub struct ProjectBacked {
    pub project: Pubkey,
    pub backer: Pubkey,
    pub amount: u64,
    pub multiplier: u64,
    pub total_backing: u64,
}

#[event]
pub struct MilestoneVerified {
    pub project: Pubkey,
    pub verifier: Pubkey,
    pub milestone_index: u8,
    pub payout_amount: u64,
    pub milestones_completed: u8,
}

#[event]
pub struct RewardClaimed {
    pub project: Pubkey,
    pub backer: Pubkey,
    pub backing_index: u32,
    pub amount: u64,
    pub reward_amount: u64,
    pub multiplier: u64,
}

#[event]
pub struct LoanRepaid {
    pub project: Pubkey,
    pub developer: Pubkey,
    pub amount: u64,
    pub used_amount: u64,
    pub reputation: u64,
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
        "pledgebond:sns-identity:v1:{}:{}:{}:{}:{}",
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
