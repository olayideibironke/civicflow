"""Exercise competing refund postings in separate PostgreSQL sessions (CI only)."""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import subprocess

DATABASE = "civicflow_financial_ci"
PAYMENT = "14141414-1414-4414-8414-141414141414"
INBOXES = [
    "15151515-1515-4515-8515-151515151515",
    "16161616-1616-4616-8616-161616161616",
]


def sql(statement: str, *, expect_success: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-At", "-d", DATABASE, "-c", statement],
        capture_output=True, text=True, timeout=20, check=False,
    )
    if expect_success and result.returncode:
        raise AssertionError(f"PostgreSQL error: {result.stderr}")
    return result


sql("""
insert into public.organizations(id) values ('12121212-1212-4212-8212-121212121212');
insert into public.billing_invoices(id,organization_id,currency)
values ('13131313-1313-4313-8313-131313131313','12121212-1212-4212-8212-121212121212','usd');
insert into public.billing_payments(id,organization_id,invoice_id,amount_cents,status,processor,processor_reference)
values ('14141414-1414-4414-8414-141414141414','12121212-1212-4212-8212-121212121212',
'13131313-1313-4313-8313-131313131313',10000,'succeeded','stripe','pi_concurrency');
insert into public.organization_payment_connections(organization_id,stripe_account_id,provider,mode)
values ('12121212-1212-4212-8212-121212121212','acct_concurrency','stripe','sandbox');
insert into public.client_payment_event_inbox
(id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
values
('15151515-1515-4515-8515-151515151515','12121212-1212-4212-8212-121212121212',
'acct_concurrency','evt_concurrency1','re_concurrency1','pi_concurrency',6000,'usd','succeeded','refund.created',false,now()),
('16161616-1616-4616-8616-161616161616','12121212-1212-4212-8212-121212121212',
'acct_concurrency','evt_concurrency2','re_concurrency2','pi_concurrency',6000,'usd','succeeded','refund.created',false,now());
select public.authorize_client_payment_adjustment_posting(
'15151515-1515-4515-8515-151515151515','14141414-1414-4414-8414-141414141414');
select public.authorize_client_payment_adjustment_posting(
'16161616-1616-4616-8616-161616161616','14141414-1414-4414-8414-141414141414');
""")

barrier = Barrier(2)


def attempt(inbox: str) -> subprocess.CompletedProcess[str]:
    barrier.wait(timeout=10)
    return sql(
        f"select public.post_verified_client_payment_adjustment('{inbox}','{PAYMENT}');",
        expect_success=False,
    )


with ThreadPoolExecutor(max_workers=2) as executor:
    outcomes = list(executor.map(attempt, INBOXES))

successes = [result for result in outcomes if result.returncode == 0]
rejections = [result for result in outcomes if result.returncode != 0]
if len(successes) != 1 or len(rejections) != 1:
    raise AssertionError(f"Expected one posted refund and one rejection: {outcomes!r}")
if "Aggregate refunds exceed original payment" not in rejections[0].stderr:
    raise AssertionError(f"Unexpected rejected posting: {rejections[0].stderr}")

ledger_count = sql(
    f"select count(*) from public.client_payment_adjustments where payment_id='{PAYMENT}'"
).stdout.strip()
states = sql(
    "select processing_state from public.client_payment_event_inbox "
    "where id in ('15151515-1515-4515-8515-151515151515',"
    "'16161616-1616-4616-8616-161616161616') order by processing_state"
).stdout.strip().splitlines()
if ledger_count != "1" or states != ["processed", "ready_for_posting"]:
    raise AssertionError(f"Partial or duplicate posting: ledger={ledger_count}, states={states}")
print("PASS: two concurrent 6000-cent refunds against a 10000-cent payment yield one posting.")

# Both workers racing the SAME already-processed event must return the same
# immutable ledger ID and must not create a second financial entry.
winner = INBOXES[outcomes.index(successes[0])]
before = sql(
    f"select id from public.client_payment_adjustments where stripe_event_id = "
    f"(select stripe_event_id from public.client_payment_event_inbox where id='{winner}')"
).stdout.strip()
replay_barrier = Barrier(2)


def replay(_: int) -> subprocess.CompletedProcess[str]:
    replay_barrier.wait(timeout=10)
    return sql(
        f"select public.post_verified_client_payment_adjustment('{winner}','{PAYMENT}');",
        expect_success=False,
    )


with ThreadPoolExecutor(max_workers=2) as executor:
    replays = list(executor.map(replay, range(2)))
if any(result.returncode != 0 or result.stdout.strip() != before for result in replays):
    raise AssertionError(f"Concurrent replay did not return identical ledger ID: {replays!r}")
if sql(
    f"select count(*) from public.client_payment_adjustments where payment_id='{PAYMENT}'"
).stdout.strip() != "1":
    raise AssertionError("Concurrent replay duplicated a financial adjustment")
print("PASS: two concurrent replays return one stable ledger ID without duplication.")

# Race the INITIAL posting of one authorized inbox row. Unlike replay of an
# already-processed event, both sessions begin before the first ledger insert.
fresh = "17171717-1717-4717-8717-171717171717"
sql(f"""
insert into public.client_payment_event_inbox
(id,organization_id,connected_account_id,stripe_event_id,stripe_object_id,
stripe_payment_intent_id,amount_cents,currency,stripe_status,event_type,livemode,occurred_at)
values ('{fresh}','12121212-1212-4212-8212-121212121212',
'acct_concurrency','evt_concurrency3','re_concurrency3','pi_concurrency',
4000,'usd','succeeded','refund.created',false,now());
select public.authorize_client_payment_adjustment_posting('{fresh}','{PAYMENT}');
""")
initial_barrier = Barrier(2)


def first_post(_: int) -> subprocess.CompletedProcess[str]:
    initial_barrier.wait(timeout=10)
    return sql(
        f"select public.post_verified_client_payment_adjustment('{fresh}','{PAYMENT}');",
        expect_success=False,
    )


with ThreadPoolExecutor(max_workers=2) as executor:
    initial_results = list(executor.map(first_post, range(2)))
initial_ids = [result.stdout.strip() for result in initial_results]
if any(result.returncode != 0 for result in initial_results) or len(set(initial_ids)) != 1:
    raise AssertionError(f"Concurrent initial posting did not converge: {initial_results!r}")
if sql(
    "select count(*) from public.client_payment_adjustments "
    "where stripe_event_id='evt_concurrency3'"
).stdout.strip() != "1":
    raise AssertionError("Concurrent first posting created duplicate ledger entries")
if sql(
    f"select processing_state from public.client_payment_event_inbox where id='{fresh}'"
).stdout.strip() != "processed":
    raise AssertionError("Concurrent first posting failed to complete inbox")
print("PASS: concurrent initial posting returns one ledger ID and processes the inbox once.")
