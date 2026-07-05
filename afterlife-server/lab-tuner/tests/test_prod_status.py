import prod_status as ps


def test_parse_dropin():
    text = '[Service]\nEnvironment="PRETHIRD_FILLER=1"\nEnvironment="IDLE_GRACE_SEC=0.5"\n'
    assert ps.parse_dropin(text) == {"PRETHIRD_FILLER": "1", "IDLE_GRACE_SEC": "0.5"}


def test_parse_dropin_ignores_non_env():
    text = '[Service]\nExecStart=/x\nEnvironment="A=b"\n'
    assert ps.parse_dropin(text) == {"A": "b"}


def test_drift_match_and_mismatch():
    dropin = {"PRETHIRD_FILLER": "1", "IDLE_GRACE_SEC": "0.5"}
    running = {"PRETHIRD_FILLER": "1", "IDLE_GRACE_SEC": "0.3"}
    rows = {r["env"]: r for r in ps.drift(dropin, running, ["PRETHIRD_FILLER", "IDLE_GRACE_SEC"])}
    assert rows["PRETHIRD_FILLER"]["state"] == "match"
    assert rows["IDLE_GRACE_SEC"]["state"] == "drift"   # conf 0.5 != 실행 0.3(재시작 누락)


def test_drift_unknown_when_running_missing():
    rows = {r["env"]: r for r in ps.drift({"A": "1"}, {}, ["A"])}
    assert rows["A"]["state"] == "unknown"   # 실행 env 취득 실패
