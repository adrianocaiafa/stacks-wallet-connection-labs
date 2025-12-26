import {
  Cl,
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "@stacks/clarinet-sdk";

Clarinet.test({
  name: "Should allow sending a tip with valid parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const amount = 1000000; // 1 STX in micro-STX
    const memo = "Great content!";
    
    const block = chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(amount),
        types.some(Cl.stringUtf8(memo)),
      ], sender.address),
    ]);
    
    expect(block.receipts.length).toBe(1);
    expect(block.height).toBe(2);
    
    const receipt = block.receipts[0];
    expect(receipt.result).toBeOk(Cl.bool(true));
  },
});

Clarinet.test({
  name: "Should reject tip with zero amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const block = chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(0),
        types.none(),
      ], sender.address),
    ]);
    
    expect(block.receipts[0].result).toBeErr(Cl.uint(1001)); // ERR-INVALID-AMOUNT
  },
});

Clarinet.test({
  name: "Should reject tip to self",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    
    const block = chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(sender.address),
        types.uint(1000000),
        types.none(),
      ], sender.address),
    ]);
    
    expect(block.receipts[0].result).toBeErr(Cl.uint(1002)); // ERR-INVALID-RECIPIENT
  },
});

Clarinet.test({
  name: "Should reject tip with memo too long",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const longMemo = "a".repeat(141); // 141 characters, max is 140
    
    const block = chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(1000000),
        types.some(Cl.stringUtf8(longMemo)),
      ], sender.address),
    ]);
    
    expect(block.receipts[0].result).toBeErr(Cl.uint(1003)); // ERR-MEMO-TOO-LONG
  },
});

Clarinet.test({
  name: "Should store tip data correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const amount = 1000000;
    const memo = "Test tip";
    
    chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(amount),
        types.some(Cl.stringUtf8(memo)),
      ], sender.address),
    ]);
    
    // Check tip received
    const tipReceived = chain.callReadOnlyFn(
      "tip-jar",
      "get-tip-received",
      [
        types.principal(recipient.address),
        types.uint(0), // First tip, ID 0
      ],
      sender.address
    );
    
    expect(tipReceived.result).toBeSome();
    
    // Check tip sent
    const tipSent = chain.callReadOnlyFn(
      "tip-jar",
      "get-tip-sent",
      [
        types.principal(sender.address),
        types.uint(0),
      ],
      sender.address
    );
    
    expect(tipSent.result).toBeSome();
  },
});

Clarinet.test({
  name: "Should update tipper stats correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const amount1 = 1000000;
    const amount2 = 2000000;
    
    chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(amount1),
        types.none(),
      ], sender.address),
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(amount2),
        types.none(),
      ], sender.address),
    ]);
    
    const stats = chain.callReadOnlyFn(
      "tip-jar",
      "get-tipper-stats",
      [types.principal(sender.address)],
      sender.address
    );
    
    expect(stats.result).toBeSome(
      Cl.tuple({
        "total-sent": Cl.uint(amount1 + amount2),
        "count": Cl.uint(2),
      })
    );
  },
});

Clarinet.test({
  name: "Should update recipient stats correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    const amount = 1000000;
    
    chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(amount),
        types.none(),
      ], sender.address),
    ]);
    
    const stats = chain.callReadOnlyFn(
      "tip-jar",
      "get-recipient-stats",
      [types.principal(recipient.address)],
      sender.address
    );
    
    expect(stats.result).toBeSome(
      Cl.tuple({
        "total-received": Cl.uint(amount),
        "count": Cl.uint(1),
      })
    );
  },
});

Clarinet.test({
  name: "Should increment tip counter",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const sender = accounts.get("wallet_1")!;
    const recipient = accounts.get("wallet_2")!;
    
    chain.mineBlock([
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(1000000),
        types.none(),
      ], sender.address),
      Tx.contractCall("tip-jar", "tip", [
        types.principal(recipient.address),
        types.uint(2000000),
        types.none(),
      ], sender.address),
    ]);
    
    const counter = chain.callReadOnlyFn(
      "tip-jar",
      "get-tip-counter",
      [],
      sender.address
    );
    
    expect(counter.result).toBeUint(2);
  },
});
