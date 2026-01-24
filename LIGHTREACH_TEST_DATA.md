# LightReach Test Data

Below is a list of test data that can be used to create resources in various configurations.

## Simulated Credit Check - No Credit Provider

These test cases use SSNs that trigger specific responses without requiring a real credit provider.

| First Name | Last Name | Address 1 | City | State | Zip | Social Security Number | Finance Decision | Limited Monthly Payment Options |
|------------|-----------|-----------|------|-------|-----|------------------------|------------------|--------------------------------|
| any value | any value | any value | any value | any value | any value | `500101005` | approved With Stipulations (802) | No |
| any value | any value | any value | any value | any value | any value | `500101006` | approved With Stipulations (761) | No |
| any value | any value | any value | any value | any value | any value | `500101007` | approved With Stipulations (724) | **Yes** |
| any value | any value | any value | any value | any value | any value | `500101008` | approved With Stipulations (703) | **Yes** |
| any value | any value | any value | any value | any value | any value | `500101009` | approved With Stipulations (662) | **Yes** |
| any value | any value | any value | any value | any value | any value | `500101010` | declined (low score, 550) | No |
| any value | any value | any value | any value | any value | any value | `500101011` | declined (low score, 500) | No |
| any value | any value | any value | any value | any value | any value | `500101015` | creditFrozen | No |
| any value | any value | any value | any value | any value | any value | `500101016` | creditFrozen | No |
| any value | any value | any value | any value | any value | any value | `500101017` | applicant not found | No |

**Note:** For simulated credit checks, you can use any values for name, address, etc. The SSN determines the response.

## Sandbox Credit Check - TransUnion

These test cases use TransUnion sandbox data with specific names and addresses.

| First Name | Middle Name | Last Name | Address 1 | City | State | Zip | SSN | Finance Decision |
|------------|-------------|-----------|-----------|------|-------|-----|-----|------------------|
| Cranberry | | Saucey | 876 Turkey St | Fantasy Island | IL | 60750 | `666222525` | approved With Stipulations (671) |
| Qjohn | | Zehorne | 11315 Gordon st | Fantasy Island | IL | 60750 | `666822307` | declined (low score, 593) |
| Susan | | Toomany | 585 Wonderway st | Fantasy Island | IL | 60750 | `666381719` | approved With Stipulations (675) |
| Juice | | Grape | 224 South st | Fantasy Island | IL | 60750 | `666113332` | approved With Stipulations (702) |
| Alfredo | | Sanchez | 2821 Warren Dorris dr | Joliet | IL | 60435 | `666427102` | declined (low score, 383) |
| Jaquline | | Carr | 229 North Oakley dr | Columbus | GA | 31906 | `666706006` | declined (bankruptcy) |
| Sarah | | Knesley | 104 Bonita Avenue | Fowler | CA | 93625 | `666563316` | approved With Stipulations (750) |
| Eunice | | Bolt | 400 Elizabeth st | Charleroi | PA | 15022 | `666386118` | approved With Stipulations (757) |

## Sandbox Credit Check - Equifax

These test cases use Equifax sandbox data with encoded-looking names.

| First Name | Middle Name | Last Name | Address 1 | City | State | Zip | SSN | Finance Decision |
|------------|-------------|-----------|-----------|------|-------|-----|-----|------------------|
| ABIEKKRO | X | ECUVKU | 7896 HECHHDZERV TRCE | HARRISONVILLE | MO | 64718 | `666014657` | approved with stipulations (711) |
| ABDXNMA | | IIAMUHXSIUL | 4936 ASDA STRA | FLAT RIVER | MO | 63683 | `666015082` | approved with stipulations (708) |
| ABHN | H | QOHQML | 7519 VFCUWH MT | TEXARKANA | TX | 71829 | `666023218` | declined (low score, 536) |
| ABHNW | | VXTJFVU | 423 JOVEEKLU PASS | CORPUS CHRISTI | TX | 78402 | `666025355` | declined (low score, 503) |
| ABHBO | Z | FJCTR | 91996 RSFYJAYA TR | GALLUP | NM | 87342 | `666016863` | approved with stipulations (781) |
| ABGWEB | XWPTGU | PROF | 372 HCVFZFXRSEU SPG | COLUMBUS | GA | 31817 | `666009007` | approved with stipulations (703) |
| ABEX | H | YYRMGLGXI | 78790 HKQGNN BYU | SAN FRANCISCO | CA | 94013 | `666002288` | declined (low score, 568) |
| ABEMY | J | JUTHIO | 34684 JIZDSMXFCPMS WALK | WINGATE | MD | 21675 | `666013312` | declined (low score, 589) |
| ABDBOXVN | M | THLY | 38 JEEFEZINO CMNS | PORTLAND | ME | 4531 | `666012493` | declined (low score, 617) |
| ABBXAQH | M | ZELUWH | 995 XKTTGIHVLP XRDS | SAN BERNARDINO | CA | 92577 | `666001613` | declined (bankruptcy) |
| ABAYNJ | L | HYIQKKEDXDGFUZ | 2438 JACVEAXP PRT | ELLERSLIE | GA | 31807 | `666008413` | declined (low score, 610) |
| UQPFP | SCRP | XUMEO | 4012 DNTQTW BYP | TATE | GA | 30177 | `666028580` | not found (bureau manual review) |
| UWRLU | DLLTT | ATMTDGHT | 917 YYFIIWDWF PRT | ENNICE | NC | 28623 | `666028611` | credit frozen |

## Usage Notes

### Simulated Credit Checks
- **Best for**: Quick testing without credit provider setup
- **Use any values** for name, address, city, state, zip
- **SSN determines outcome** - use the SSN from the table above
- **Limited Monthly Payment Options**: Some SSNs trigger limited payment options (indicated in the table)

### Sandbox Credit Checks
- **Best for**: Testing with realistic credit bureau responses
- **Must use exact values** from the table (name, address, SSN must match)
- **TransUnion**: Uses "Fantasy Island, IL" addresses for most test cases
- **Equifax**: Uses encoded-looking names and various addresses

## Status Mapping

When testing, these decisions map to our internal statuses:

- `approved` → `APPROVED`
- `approved With Stipulations` / `approved with stipulations` → `CONDITIONAL`
- `declined` → `DENIED`
- `creditFrozen` → `PENDING`
- `applicant not found` / `not found` → Error (application may fail)

## Testing Scenarios

### Test Approved Application
- Use SSN: `500101005` (simulated) or `666222525` (TransUnion)
- Expected: Application approved with stipulations
- Status: `CONDITIONAL`

### Test Declined Application
- Use SSN: `500101010` (simulated) or `666822307` (TransUnion)
- Expected: Application declined due to low credit score
- Status: `DENIED`

### Test Credit Frozen
- Use SSN: `500101015` (simulated) or `666028611` (Equifax)
- Expected: Application pending due to frozen credit
- Status: `PENDING`

### Test Limited Payment Options
- Use SSN: `500101007`, `500101008`, or `500101009`
- Expected: Application approved but with limited monthly payment options
- Status: `CONDITIONAL`

### Test Bankruptcy
- Use SSN: `666706006` (TransUnion) or `666001613` (Equifax)
- Expected: Application declined due to bankruptcy
- Status: `DENIED`
