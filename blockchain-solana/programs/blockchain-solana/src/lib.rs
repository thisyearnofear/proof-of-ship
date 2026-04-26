use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod blockchain_solana {
    use super::*;

    pub fn request_funding(
        ctx: Context<RequestFunding>,
        hackathon_ids: Vec<u64>,
        github_url: String,
        project_name: String,
        milestone_descriptions: Vec<String>,
        milestone_amounts: Vec<u64>,
        verifier: Pubkey,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let credit_line = &mut ctx.accounts.credit_line;
        let developer = &ctx.accounts.developer;

        let mut total_amount: u64 = 0;
        for amount in milestone_amounts.iter() {
            total_amount += amount;
        }

        // Initialize project
        project.developer = developer.key();
        project.verifier = verifier;
        project.hackathon_ids = hackathon_ids;
        project.github_url = github_url;
        project.name = project_name;
        project.funding_amount = total_amount;
        project.is_active = true;
        project.funded_at = Clock::get()?.unix_timestamp;
        project.milestones_count = milestone_amounts.len() as u8;
        project.milestones_completed = 0;
        
        project.milestones = milestone_descriptions.iter().zip(milestone_amounts.iter()).map(|(desc, amt)| {
            Milestone {
                description: desc.clone(),
                amount: *amt,
                completed: false,
                completed_at: 0,
            }
        }).collect();

        // Initialize or update credit line
        if credit_line.last_updated == 0 {
            credit_line.developer = developer.key();
            credit_line.reputation = 400; // Default min score
            credit_line.total_amount = 5000 * 1_000_000; // Simplified max amount (5000 USDC)
            credit_line.used_amount = total_amount;
            credit_line.is_active = true;
        } else {
            credit_line.used_amount += total_amount;
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

        // Transfer USDC from backer to vault
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

        project.total_backing += amount;

        // Boost credit line
        let credit_line = &mut ctx.accounts.developer_credit_line;
        credit_line.total_amount += amount * 2;

        Ok(())
    }

    pub fn repay_loan(
        ctx: Context<RepayLoan>,
        amount: u64,
    ) -> Result<()> {
        let credit_line = &mut ctx.accounts.credit_line;
        let developer = &ctx.accounts.developer;

        // Transfer USDC from developer to vault (repayment)
        let cpi_accounts = Transfer {
            from: ctx.accounts.developer_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: developer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        credit_line.used_amount -= amount;
        
        // Repayment incentive
        let rep_gain = amount / (100 * 1_000_000);
        if rep_gain > 0 {
            credit_line.reputation += rep_gain;
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
        
        // Ensure signer is the authorized verifier
        require_keys_eq!(
            ctx.accounts.verifier.key(),
            project.verifier,
            ErrorCode::UnauthorizedVerifier
        );

        // Check milestone index bounds
        if milestone_index as usize >= project.milestones.len() {
            return Err(ErrorCode::InvalidMilestoneIndex.into());
        }

        let milestone = &mut project.milestones[milestone_index as usize];
        
        // Check if already completed
        if milestone.completed {
            return Err(ErrorCode::MilestoneAlreadyCompleted.into());
        }

        // Update milestone status
        milestone.completed = true;
        milestone.completed_at = Clock::get()?.unix_timestamp;
        project.milestones_completed += 1;

        // Payout to developer
        let payout_amount = milestone.amount;
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

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(hackathon_ids: Vec<u64>, github_url: String, project_name: String)]
pub struct RequestFunding<'info> {
    #[account(
        init,
        payer = developer,
        space = 8 + 32 + 32 + 8 + 200 + 100 + 8 + 1 + 8 + 1 + 1 + (10 * 200), // Added 32 for verifier
        seeds = [b"project", developer.key().as_ref(), project_name.as_bytes()],
        bump
    )]
    pub project: Account<'info, Project>,

    #[account(
        init_if_needed,
        payer = developer,
        space = 8 + 32 + 8 + 8 + 8 + 1 + 8,
        seeds = [b"credit_line", developer.key().as_ref()],
        bump
    )]
    pub credit_line: Account<'info, CreditLine>,

    #[account(mut)]
    pub developer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BackProject<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,

    #[account(
        mut,
        seeds = [b"credit_line", project.developer.as_ref()],
        bump
    )]
    pub developer_credit_line: Account<'info, CreditLine>,

    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(mut)]
    pub backer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(
        mut,
        seeds = [b"credit_line", developer.key().as_ref()],
        bump
    )]
    pub credit_line: Account<'info, CreditLine>,

    #[account(mut)]
    pub developer: Signer<'info>,

    #[account(mut)]
    pub developer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The signer is not the authorized verifier for this project.")]
    UnauthorizedVerifier,
    #[msg("The milestone has already been completed.")]
    MilestoneAlreadyCompleted,
    #[msg("The milestone index is out of bounds.")]
    InvalidMilestoneIndex,
}

#[derive(Accounts)]
pub struct VerifyMilestone<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,

    /// CHECK: This is the developer's token account, we trust the program to transfer to it
    #[account(mut)]
    pub developer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault_authority.key()
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA used as authority for the vault
    #[account(
        seeds = [b"vault_authority", project.key().as_ref()],
        bump
    )]
    pub vault_authority: AccountInfo<'info>,

    pub verifier: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Project {
    pub developer: Pubkey,
    pub verifier: Pubkey,
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
