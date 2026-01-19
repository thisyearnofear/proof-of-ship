import React, { createContext, useContext } from 'react';

const BuilderCreditContext = createContext();

export const useBuilderCredit = () => {
    const context = useContext(BuilderCreditContext);
    // Return a mock if context not provided to satisfy CircleWalletContext
    return context || {
        coreContract: null,
        usdcContract: null,
        requestFunding: async () => { throw new Error('BuilderCredit not available'); },
        repayLoan: async () => { throw new Error('BuilderCredit not available'); },
        calculateFundingAmount: async () => '0'
    };
};

export const BuilderCreditProvider = ({ children }) => {
    return (
        <BuilderCreditContext.Provider value={null}>
            {children}
        </BuilderCreditContext.Provider>
    );
};

export default BuilderCreditContext;
