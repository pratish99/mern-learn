import type { ModuleContent } from "@/lib/types";

const mongodbTransactions: ModuleContent = {
  id: "mongodb-transactions",
  title: "Transactions & atomic operations",
  category: "Mongoose & Production",
  order: 12,
  explanation: `
Every update seen so far — \`updateOne\`, \`$inc\`, a \`pre("save")\` hook
— has changed exactly one document at a time. MongoDB guarantees that a
single-document write is **atomic**: another read can never see that
document half-updated. Most of the time, that's already enough.

### Single-document atomicity is often all you need

\`\`\`js
await accounts.updateOne({ _id: accountId }, { $inc: { balance: -amount } });
\`\`\`

\`$inc\` reads and writes the balance in one atomic step — there's no
window where a concurrent request could read a stale value between
"read the balance" and "write the new balance," because the increment
happens entirely inside MongoDB, not in your application code.

### When one document isn't enough: multi-document transactions

Some operations inherently touch more than one document — the classic
example is transferring money between two accounts, which requires
decrementing one document and incrementing another. Without extra
help, a crash between those two writes could leave money deducted from
one account and never credited to the other. A **transaction**, using
a **session**, makes a group of writes all-or-nothing across multiple
documents (and even multiple collections):

\`\`\`js
const session = client.startSession();
try {
  session.startTransaction();
  await accounts.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
  await accounts.updateOne({ _id: toId }, { $inc: { balance: amount } }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction(); // undoes BOTH writes, not just the failed one
  throw err;
} finally {
  session.endSession();
}
\`\`\`

Every operation passed the same \`{ session }\` becomes part of one
transaction: either every write in it commits together, or (on any
error) \`abortTransaction()\` rolls all of them back — there's no
in-between state where only the debit happened.

### Reach for transactions deliberately

Transactions have a real performance cost (extra coordination
overhead compared to independent writes), so the practical guideline
is: model your data (via embedding, from a few modules back) so that
the operations that need to be atomic together can often be done as a
single-document update; reach for a multi-document transaction only
when the operation genuinely can't be expressed that way — a transfer
between two independent account documents being the textbook case.

### Why this matters

"Either both writes happen, or neither does" is the exact guarantee a
transaction exists to provide — the same all-or-nothing idea a
database transaction gives you in SQL. Recognizing which operations
need that guarantee (crossing document or collection boundaries) vs.
which are already safe as single-document atomic writes is what keeps
you from either under-protecting a critical multi-document operation
or over-using transactions where a simple \`$inc\` would do.
`.trim(),
  codeExamples: [
    {
      title: "An atomic single-document update needs no transaction",
      code: `await accounts.updateOne({ _id: accountId }, { $inc: { balance: -amount } });
// safe on its own — the read-then-write happens atomically inside MongoDB`,
    },
    {
      title: "A multi-document transfer, all-or-nothing",
      code: `const session = client.startSession();
try {
  session.startTransaction();
  await accounts.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
  await accounts.updateOne({ _id: toId }, { $inc: { balance: amount } }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}`,
    },
  ],
  challenge: {
    functionName: "transferFunds",
    prompt: `Write transferFunds(accounts, fromId, toId, amount), simulating an
all-or-nothing multi-document transaction that moves money between two
accounts in an in-memory "accounts" array (each { _id, balance }).

- If either "fromId" or "toId" doesn't match an account, abort:
  return { accounts, success: false, error: "Account not found" } with
  the original "accounts" array completely unchanged.
- If the source account's balance is less than "amount", abort:
  return { accounts, success: false, error: "Insufficient funds" },
  again with "accounts" unchanged.
- Otherwise, apply BOTH updates together — subtract "amount" from the
  source account's balance and add it to the destination account's
  balance — and return { accounts: updatedAccounts, success: true }.
  All other accounts in the array are returned unchanged. Do not
  mutate the original "accounts" array in any case.`,
    starterCode: `function transferFunds(accounts, fromId, toId, amount) {
  // your code here
}`,
    solutionCode: `function transferFunds(accounts, fromId, toId, amount) {
  const fromAccount = accounts.find((a) => a._id === fromId);
  const toAccount = accounts.find((a) => a._id === toId);

  if (!fromAccount || !toAccount) {
    return { accounts, success: false, error: "Account not found" };
  }

  if (fromAccount.balance < amount) {
    return { accounts, success: false, error: "Insufficient funds" };
  }

  const updated = accounts.map((a) => {
    if (a._id === fromId) return { ...a, balance: a.balance - amount };
    if (a._id === toId) return { ...a, balance: a.balance + amount };
    return a;
  });

  return { accounts: updated, success: true };
}`,
    testCases: [
      {
        name: "a successful transfer moves balance between two accounts",
        args: () => [[{ _id: 1, balance: 100 }, { _id: 2, balance: 50 }], 1, 2, 30],
        expected: { accounts: [{ _id: 1, balance: 70 }, { _id: 2, balance: 80 }], success: true },
      },
      {
        name: "insufficient funds aborts the whole transfer, accounts unchanged",
        args: () => [[{ _id: 1, balance: 10 }, { _id: 2, balance: 50 }], 1, 2, 30],
        expected: {
          accounts: [{ _id: 1, balance: 10 }, { _id: 2, balance: 50 }],
          success: false,
          error: "Insufficient funds",
        },
      },
      {
        name: "a missing account aborts, nothing is deducted from the valid one",
        args: () => [[{ _id: 1, balance: 100 }], 1, 99, 10],
        expected: { accounts: [{ _id: 1, balance: 100 }], success: false, error: "Account not found" },
      },
      {
        name: "transferring the exact full balance succeeds",
        args: () => [[{ _id: 1, balance: 20 }, { _id: 2, balance: 0 }], 1, 2, 20],
        expected: { accounts: [{ _id: 1, balance: 0 }, { _id: 2, balance: 20 }], success: true },
      },
      {
        name: "unrelated accounts in the collection are left untouched",
        args: () => [
          [{ _id: 1, balance: 100 }, { _id: 2, balance: 50 }, { _id: 3, balance: 9 }],
          1,
          2,
          10,
        ],
        expected: {
          accounts: [{ _id: 1, balance: 90 }, { _id: 2, balance: 60 }, { _id: 3, balance: 9 }],
          success: true,
        },
      },
    ],
  },
};

export default mongodbTransactions;
