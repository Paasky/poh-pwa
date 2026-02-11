# PoH Test Bible

Follow these rules when writing tests. They are an extension of the `docs/ProjectBible.md`

## Rules

1. **Never mock internals**
    - Tests must give confidence the feature will work IRL.
    - Mocking everything means you are testing the code works with your mock; not that the code works.
    - Allowed exceptions:
        - Predetermined Rng values
        - Stateless Babylon engine
        - Action/Event Buses
2. **Always mock externals**
    - Tests should never interact with external services.
    - This includes Browser rendering, HTTP requests, and file i/o.
3. **Test folder structure and file names must be 1:1 with the code they test**
    - No guessing where the test should go or be named.
    - Easy to spot what is/isn't tested.
4. **Always test happy and known failure paths**
    - The code is designed to fail and throw when needed, not to hide errors.
    - Verify invalid states/data is NOT handled gracefully but stops execution.
5. **Always verify full data output**
    - Verify data is 1:1 as expected.
    - No "expect object to have key" assertions, always "object is exactly" assertions.
6. **Never assume existing code/tests are true**
    - The code may have recently changed, forcing the test to need fixing.
    - Tests breaking on code update is expected, not to be fought against.
7. **Always check for existing helpers**
    - Use existing helpers when possible, adding new helpers only when absolutely necessary.
    - Prefer existing regular helpers to new special test helpers.
8. **Use `_setup/dataHelpers` for all test data**
    - Use the `fooRawData()` functions to generate game data.
    - Unless testing a simple helper, most tests need data from the global bucket.
        - `initTestDataBucket()` & `destroyDataBucket()`
9. **Never make up Type Objects**
    - Always use the real Type Objects from `data/types/*.json`
    - They will automatically exist inside the DataBucket.
10. **In testing, KISS > DRY**
    - Keep tests simple and readable, avoid unnecessary complexity.
    - Test debuggability is more important then SOLID principles.