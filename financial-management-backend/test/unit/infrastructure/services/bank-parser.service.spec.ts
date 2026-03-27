import { OFXParserService, CSVParserService } from '@infrastructure/services/bank-parser.service';

const OFX_SAMPLE = `
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <LEDGERBAL>
          <DTSTART>20260301</DTSTART>
          <DTEND>20260331</DTEND>
        </LEDGERBAL>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260310</DTPOSTED>
            <TRNAMT>-150.00</TRNAMT>
            <FITID>20260310001</FITID>
            <MEMO>Supermercado Extra</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260315</DTPOSTED>
            <TRNAMT>3000.00</TRNAMT>
            <FITID>20260315001</FITID>
            <MEMO>Salário</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>
`;

const CSV_SAMPLE = `data,descricao,valor,tipo
2026-03-10,Supermercado,-150,DEBITO
2026-03-15,Salário,3000,CREDITO
`;

describe('OFXParserService', () => {
  let parser: OFXParserService;

  beforeEach(() => {
    parser = new OFXParserService();
  });

  it('should parse OFX with DEBIT as negative amount → DEBIT type', () => {
    const result = parser.parse(OFX_SAMPLE);
    const debit = result.entries.find(e => e.description === 'Supermercado Extra');
    expect(debit).toBeDefined();
    expect(debit!.type).toBe('DEBIT');
    expect(debit!.amount).toBe(150);
  });

  it('should parse OFX with CREDIT as positive amount → CREDIT type', () => {
    const result = parser.parse(OFX_SAMPLE);
    const credit = result.entries.find(e => e.description === 'Salário');
    expect(credit).toBeDefined();
    expect(credit!.type).toBe('CREDIT');
    expect(credit!.amount).toBe(3000);
  });

  it('should parse FITID as externalId', () => {
    const result = parser.parse(OFX_SAMPLE);
    expect(result.entries[0].externalId).toBe('20260310001');
  });

  it('should parse date from DTPOSTED (YYYYMMDD)', () => {
    const result = parser.parse(OFX_SAMPLE);
    const debit = result.entries.find(e => e.externalId === '20260310001');
    expect(debit!.date).toEqual(new Date(2026, 2, 10)); // March is month 2 (0-indexed)
  });

  it('should return periodStart and periodEnd from DTSTART/DTEND', () => {
    const result = parser.parse(OFX_SAMPLE);
    expect(result.periodStart).toEqual(new Date(2026, 2, 1));
    expect(result.periodEnd).toEqual(new Date(2026, 2, 31));
  });

  it('should return empty entries for OFX without STMTTRN blocks', () => {
    const result = parser.parse('<OFX></OFX>');
    expect(result.entries).toHaveLength(0);
  });

  it('should skip entries without DTPOSTED or TRNAMT', () => {
    const incomplete = `<OFX><STMTTRN><TRNTYPE>DEBIT</TRNTYPE><MEMO>Test</MEMO></STMTTRN></OFX>`;
    const result = parser.parse(incomplete);
    expect(result.entries).toHaveLength(0);
  });
});

describe('CSVParserService', () => {
  let parser: CSVParserService;

  beforeEach(() => {
    parser = new CSVParserService();
  });

  it('should parse CSV with Brazilian column names', async () => {
    const entries = await parser.parse(CSV_SAMPLE);

    expect(entries).toHaveLength(2);
    expect(entries[0].description).toBe('Supermercado');
    expect(entries[1].description).toBe('Salário');
  });

  it('should classify DEBITO as DEBIT type', async () => {
    const entries = await parser.parse(CSV_SAMPLE);
    const debit = entries.find(e => e.description === 'Supermercado');
    expect(debit!.type).toBe('DEBIT');
    expect(debit!.amount).toBe(150);
  });

  it('should classify CREDITO as CREDIT type', async () => {
    const entries = await parser.parse(CSV_SAMPLE);
    const credit = entries.find(e => e.description === 'Salário');
    expect(credit!.type).toBe('CREDIT');
    expect(credit!.amount).toBe(3000);
  });

  it('should parse amount as absolute value', async () => {
    const entries = await parser.parse(CSV_SAMPLE);
    entries.forEach(e => {
      expect(e.amount).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle CSV with English column names', async () => {
    const englishCSV = `date,description,amount,type\n2026-03-10,Grocery,-200,DEBIT\n`;
    const entries = await parser.parse(englishCSV);
    expect(entries[0].description).toBe('Grocery');
    expect(entries[0].type).toBe('DEBIT');
  });
});
