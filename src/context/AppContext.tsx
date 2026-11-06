  const setUserViewingSupport = (userId: string, isViewing: boolean) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const timeStr = new Date().toLocaleTimeString();
    setActiveSupportUsers((prev) => {
      if (isViewing) {
        if (prev.some((p) => p.userId === userId)) return prev;
        return [{ userId, userName: targetUser.name, uid: targetUser.uid, enteredAt: timeStr }, ...prev];
      }
      return prev.filter((p) => p.userId !== userId);
    });
  };

  // Balance Management
  const adjustUserBalance = ({
    userId,
    amount,
    type,
    reason,
    wallet = 'trading',
  }: {
    userId: string;
    amount: number;
    type: BalanceAdjustmentType;
    reason: string;
    wallet?: 'trading' | 'funding';
  }) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const isFunding = wallet === 'funding';
    const previousBalance = isFunding ? targetUser.fundingBalance : targetUser.tradingBalance;
    const newBalance = Number(Math.max(0, previousBalance + amount).toFixed(2));

    if (isSuperAdmin && supabase) {
      void supabase.rpc('admin_update_profile', {
        p_user_id: userId,
        p_trading_balance: isFunding ? null : newBalance,
        p_funding_balance: isFunding ? newBalance : null,
        p_status: null,
      }).then(({ error }) => {
        if (error) console.error('Admin balance update failed:', error.message);
      });
    }
    setUsers((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      return isFunding ? { ...u, fundingBalance: newBalance } : { ...u, tradingBalance: newBalance };
    }));

    const adjustment: BalanceAdjustment = {
      id: `adj-${Date.now()}`,
      userId,
      userName: targetUser.name,
      amount,
      type,
      previousBalance,
      newBalance,
      reason: `${isFunding ? '[Funding Wallet] ' : '[Trading Wallet] '}${reason}`,
      adminId: 'admin-01',
      adminName,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setBalanceAdjustments((prev) => [adjustment, ...prev]);

    logAuditAction(
      'BALANCE_ADJUSTMENT',
      `${targetUser.name} (${targetUser.uid})`,
      `${amount >= 0 ? '+' : ''}$${amount.toLocaleString()} on ${isFunding ? 'Funding' : 'Trading'} Wallet [${type}]: ${reason}`
    );
  };

  // Deposit Management
  const submitDepositRequest = ({
    amount,
    txid,
    paymentMethod,
    network,
    note,
  }: {
    amount: number;
    txid: string;
    paymentMethod: string;
    network?: string;
    note?: string;
  }) => {
    const newReq: DepositRequest = {
      id: `dep-${Date.now().toString().slice(-6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      amount,
      txid,
      paymentMethod,
      network: network || 'Default',
      status: 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note,
    };
    setDepositRequests((prev) => [newReq, ...prev]);
  };

  const approveDeposit = (depositId: string) => {
    const dep = depositRequests.find((d) => d.id === depositId);
    if (!dep || dep.status !== 'pending') return;

    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'approved',
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );

    adjustUserBalance({
      userId: dep.userId,
      amount: dep.amount,
      type: 'deposit',
      reason: `Approved deposit request #${dep.id} (TXID: ${dep.txid.slice(0, 12)}...)`,
    });
  };

  const rejectDeposit = (depositId: string, note?: string) => {
    setDepositRequests((prev) =>
      prev.map((d) =>
        d.id === depositId
          ? {
              ...d,
              status: 'rejected',
              note: note || d.note,
              reviewedBy: adminName,
              reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : d
      )
    );
    const dep = depositRequests.find((d) => d.id === depositId);
    logAuditAction(
      'DEPOSIT_REJECTED',
      dep ? `${dep.userName} (#${dep.id})` : depositId,
      `Deposit of $${dep?.amount || 0} rejected: ${note || 'Invalid payment verification.'}`
    );
  };

  // Withdrawal Management
  const submitWithdrawalRequest = ({
    amount,
    accountHolderName,
    bankOrAddress,
    network,
    withdrawalType = 'USD',
    notes,
  }: {
    amount: number;
    accountHolderName: string;
    bankOrAddress: string;
