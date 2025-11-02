module tender_payment::payment_system {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    const E_INVALID_AMOUNT: u64 = 1;

    /// Simple entry function: admin (signer) pays contractor address `amount` APT
    public entry fun pay_contractor(admin: &signer, contractor: address, amount: u64) {
        assert!(amount > 0, E_INVALID_AMOUNT);

        // transfer AptosCoin from the signer's account to contractor
        coin::transfer<AptosCoin>(admin, contractor, amount);
    }
}

