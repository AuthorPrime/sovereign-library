import React, { useState } from 'react';

const navy = '#1a2332';
const gold = '#c9a227';
const lightGold = '#f4e9c8';
const cream = '#faf8f5';

const Header = () => (
  <div style={{ borderBottom: `2px solid ${gold}`, paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' }}>
    <div style={{ display: 'inline-block', width: '50px', height: '50px', border: `2px solid ${gold}`, marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ color: gold, fontSize: '18px', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>DSS</span>
      </div>
    </div>
    <h1 style={{ fontSize: '22px', fontWeight: '700', color: navy, letterSpacing: '3px', margin: '0 0 4px 0', fontFamily: 'Georgia, serif' }}>
      DIGITAL SOVEREIGN SOCIETY
    </h1>
    <p style={{ fontSize: '9px', color: gold, letterSpacing: '4px', margin: 0, fontFamily: 'Georgia, serif' }}>
      SOVEREIGNTY THROUGH KNOWLEDGE
    </p>
  </div>
);

const Footer = () => (
  <div style={{ borderTop: `1px solid ${gold}`, paddingTop: '12px', marginTop: 'auto', fontSize: '8px', color: navy, textAlign: 'center' }}>
    <div style={{ marginBottom: '3px' }}>
      <strong style={{ fontSize: '9px' }}>William Hunter Laustrup</strong> · Co-Founder & Director
    </div>
    <div style={{ marginBottom: '3px', color: gold, letterSpacing: '1px', fontSize: '7px' }}>
      Digital Sovereign Society in Collaboration with Apollo & Will Global Network
    </div>
    <div style={{ letterSpacing: '0.5px', fontSize: '7px' }}>
      A+W G.N.O.S.I.S. · info@digitalsovereign.org · 557-203-7055
    </div>
  </div>
);

const PageWrapper = ({ children, title }) => (
  <div style={{ padding: '25px 30px', background: cream, minHeight: '100%', fontFamily: 'system-ui', color: navy, fontSize: '10px', display: 'flex', flexDirection: 'column' }}>
    <Header />
    <h2 style={{ textAlign: 'center', fontSize: '14px', color: navy, letterSpacing: '3px', margin: '0 0 18px 0', fontFamily: 'Georgia, serif', borderBottom: `1px solid ${lightGold}`, paddingBottom: '10px' }}>
      {title}
    </h2>
    <div style={{ flex: 1 }}>{children}</div>
    <Footer />
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ background: navy, color: cream, padding: '5px 12px', fontSize: '10px', letterSpacing: '2px', fontWeight: '600', marginBottom: '8px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
    {children}
  </div>
);

const FieldBox = ({ label, height = '60px', cols = 1 }) => (
  <div style={{ flex: cols, marginBottom: '8px' }}>
    <label style={{ fontSize: '8px', color: gold, letterSpacing: '1px', fontWeight: '600', display: 'block', marginBottom: '2px' }}>{label}</label>
    <div style={{ border: `1px solid ${navy}`, height, background: 'white' }}></div>
  </div>
);

const ProjectOutline = () => (
  <PageWrapper title="PROJECT PROPOSAL & OUTLINE">
    <SectionTitle>I. PROJECT DETAILS</SectionTitle>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
      <FieldBox label="PROJECT TITLE" height="26px" cols={2} />
      <FieldBox label="DATE INITIATED" height="26px" />
      <FieldBox label="TARGET COMPLETION" height="26px" />
    </div>
    <FieldBox label="PROJECT DESCRIPTION & OBJECTIVES" height="40px" />
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="PROJECT LEAD" height="22px" />
      <FieldBox label="STAKEHOLDERS" height="22px" />
    </div>

    <SectionTitle>II. REQUIREMENTS & RESOURCES</SectionTitle>
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="TECHNICAL REQUIREMENTS" height="38px" />
      <FieldBox label="RESOURCE ALLOCATION" height="38px" />
    </div>
    <FieldBox label="DEPENDENCIES & PREREQUISITES" height="28px" />

    <SectionTitle>III. POTENTIAL IMPEDIMENTS</SectionTitle>
    <FieldBox label="KNOWN CHALLENGES & RISK ASSESSMENT" height="38px" />
    <FieldBox label="CONTINGENCY STRATEGIES" height="28px" />

    <SectionTitle>IV. MILESTONES & CHECK-INS</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
      {['MILESTONE 1', 'MILESTONE 2', 'MILESTONE 3'].map(m => (
        <div key={m} style={{ border: `1px solid ${navy}`, padding: '6px', background: 'white' }}>
          <div style={{ fontSize: '8px', color: gold, fontWeight: '600', marginBottom: '3px', textAlign: 'center' }}>{m}</div>
          <div style={{ fontSize: '7px', marginBottom: '2px' }}>Target: _______________</div>
          <div style={{ fontSize: '7px' }}>☐ Pending  ☐ Active  ☐ Complete</div>
        </div>
      ))}
    </div>

    <SectionTitle>V. REFLECTIONS & PIVOTS</SectionTitle>
    <FieldBox label="MID-PROJECT OBSERVATIONS & STRATEGIC ADJUSTMENTS" height="38px" />

    <SectionTitle>VI. PROJECT CONCLUSION</SectionTitle>
    <FieldBox label="OUTCOMES & LESSONS LEARNED" height="38px" />
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="SUCCESS METRICS" height="24px" />
      <FieldBox label="FINAL STATUS" height="24px" />
    </div>

    <SectionTitle>VII. CONTACTS & SUSTAINMENT</SectionTitle>
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="NEW CONTACTS / FOLLOW-UP" height="34px" />
      <FieldBox label="SUSTAINMENT SUMMARY" height="34px" />
    </div>
  </PageWrapper>
);

const DailyPlanner = () => {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return (
    <PageWrapper title="DAILY SOVEREIGNTY PLANNER">
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', color: gold, letterSpacing: '1px', marginRight: '4px' }}>MONTH</span>
          {romanNumerals.map(n => (
            <div key={n} style={{ width: '16px', height: '16px', border: `1px solid ${navy}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', background: 'white' }}>{n}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '8px', color: gold }}>DAY</span>
          <div style={{ width: '30px', height: '18px', border: `1px solid ${navy}`, background: 'white' }}></div>
          <span style={{ fontSize: '8px', color: gold }}>YEAR</span>
          <div style={{ width: '45px', height: '18px', border: `1px solid ${navy}`, background: 'white' }}></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <SectionTitle>PRIME DIRECTIVES</SectionTitle>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <div style={{ width: '18px', height: '18px', border: `2px solid ${gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: navy }}>{i}</div>
              <div style={{ flex: 1, height: '18px', borderBottom: `1px solid ${navy}` }}></div>
            </div>
          ))}
          
          <SectionTitle>SCHEDULED ACTIONS</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '45px 1fr', gap: '1px', fontSize: '8px' }}>
            {['0600', '0800', '1000', '1200', '1400', '1600', '1800', '2000'].map(t => (
              <React.Fragment key={t}>
                <div style={{ color: gold, fontWeight: '600', paddingRight: '6px' }}>{t}</div>
                <div style={{ borderBottom: `1px solid ${lightGold}`, height: '16px' }}></div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>PROJECT FOCUS</SectionTitle>
          <FieldBox label="ACTIVE PROJECT" height="22px" />
          <FieldBox label="TODAY'S OBJECTIVE" height="32px" />
          <FieldBox label="BLOCKERS / NEEDS" height="32px" />
          
          <SectionTitle>FIELD NOTES</SectionTitle>
          <div style={{ border: `1px solid ${navy}`, height: '90px', background: 'white' }}></div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <SectionTitle>END OF DAY REFLECTION</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <FieldBox label="VICTORIES" height="45px" />
          <FieldBox label="CHALLENGES FACED" height="45px" />
          <FieldBox label="TOMORROW'S PRIORITY" height="45px" />
        </div>
      </div>
    </PageWrapper>
  );
};

const WeeklyPlanner = () => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const metrics = ['FOCUS', 'ENERGY', 'PROGRESS', 'DISCIPLINE'];
  return (
    <PageWrapper title="WEEKLY STRATEGIC OVERVIEW">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
        <span style={{ fontSize: '9px', color: gold }}>WEEK OF:</span>
        <div style={{ width: '180px', borderBottom: `1px solid ${navy}` }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
        {days.map(day => (
          <div key={day} style={{ border: `1px solid ${navy}` }}>
            <div style={{ background: navy, color: cream, padding: '3px', fontSize: '8px', textAlign: 'center', letterSpacing: '1px' }}>{day}</div>
            <div style={{ padding: '4px', height: '105px', background: 'white' }}>
              <div style={{ fontSize: '7px', color: gold, marginBottom: '2px' }}>PRIORITY:</div>
              <div style={{ borderBottom: `1px solid ${lightGold}`, height: '16px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '7px', color: gold, marginBottom: '2px' }}>TASKS:</div>
              {[1,2,3].map(i => <div key={i} style={{ borderBottom: `1px solid ${lightGold}`, height: '12px' }}></div>)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
        <div>
          <SectionTitle>WEEKLY OBJECTIVES</SectionTitle>
          <FieldBox label="PRIMARY GOAL" height="26px" />
          <FieldBox label="SECONDARY GOALS" height="34px" />
          <FieldBox label="WEEKLY NOTES & OBSERVATIONS" height="50px" />
        </div>
        <div>
          <SectionTitle>SOVEREIGNTY SCORECARD</SectionTitle>
          <div style={{ border: `1px solid ${navy}`, padding: '8px', background: 'white' }}>
            <div style={{ fontSize: '7px', marginBottom: '6px', color: gold, textAlign: 'center' }}>Rate 1-5 each day</div>
            {metrics.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '5px' }}>
                <span style={{ width: '55px', fontSize: '7px', fontWeight: '600' }}>{m}</span>
                {[1,2,3,4,5,6,7].map(d => (
                  <div key={d} style={{ width: '14px', height: '14px', border: `1px solid ${navy}`, fontSize: '7px', textAlign: 'center' }}></div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${gold}`, marginTop: '6px', paddingTop: '5px', textAlign: 'center' }}>
              <span style={{ fontSize: '7px', color: gold }}>WEEKLY AVG: ______</span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

const MonthlyOverview = () => (
  <PageWrapper title="MONTHLY STRATEGIC CALENDAR">
    <div style={{ display: 'flex', gap: '15px', marginBottom: '12px', justifyContent: 'center' }}>
      <span style={{ fontSize: '9px', color: gold }}>MONTH:</span>
      <div style={{ width: '120px', borderBottom: `1px solid ${navy}` }}></div>
      <span style={{ fontSize: '9px', color: gold }}>YEAR:</span>
      <div style={{ width: '70px', borderBottom: `1px solid ${navy}` }}></div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '12px' }}>
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
        <div key={d} style={{ background: navy, color: cream, padding: '3px', fontSize: '7px', textAlign: 'center', letterSpacing: '1px' }}>{d}</div>
      ))}
      {Array(35).fill(0).map((_, i) => (
        <div key={i} style={{ border: `1px solid ${navy}`, height: '48px', background: 'white', padding: '2px' }}>
          <div style={{ fontSize: '7px', color: gold }}>{i + 1 <= 31 ? i + 1 : ''}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div>
        <SectionTitle>MONTHLY OBJECTIVES</SectionTitle>
        <FieldBox label="PRIMARY MISSION" height="32px" />
        <FieldBox label="KEY RESULTS" height="40px" />
      </div>
      <div>
        <SectionTitle>STRATEGIC NOTES</SectionTitle>
        <FieldBox label="IMPORTANT DATES & DEADLINES" height="32px" />
        <FieldBox label="MONTH-END REFLECTION" height="40px" />
      </div>
    </div>
  </PageWrapper>
);

const ProgressTracker = () => (
  <PageWrapper title="PROJECT PROGRESS TRACKER">
    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
      <FieldBox label="PROJECT NAME" height="22px" cols={2} />
      <FieldBox label="TRACKING PERIOD" height="22px" />
      <FieldBox label="STATUS" height="22px" />
    </div>

    <SectionTitle>PROGRESS LOG</SectionTitle>
    <div style={{ border: `1px solid ${navy}`, marginBottom: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 90px', background: navy, color: cream, fontSize: '7px' }}>
        <div style={{ padding: '5px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>DATE</div>
        <div style={{ padding: '5px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>ACTION TAKEN</div>
        <div style={{ padding: '5px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>OUTCOME / NOTES</div>
        <div style={{ padding: '5px', textAlign: 'center' }}>NEXT STEP</div>
      </div>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 90px', borderTop: `1px solid ${lightGold}` }}>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, height: '30px', background: 'white' }}></div>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, background: 'white' }}></div>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, background: 'white' }}></div>
          <div style={{ padding: '4px', background: 'white' }}></div>
        </div>
      ))}
    </div>

    <SectionTitle>ROADBLOCK DOCUMENTATION</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
      <div>
        <FieldBox label="CURRENT BLOCKER" height="42px" />
        <FieldBox label="ROOT CAUSE ANALYSIS" height="36px" />
      </div>
      <div>
        <FieldBox label="ALTERNATIVE APPROACHES" height="42px" />
        <FieldBox label="RESOURCES NEEDED" height="36px" />
      </div>
    </div>

    <SectionTitle>RESOLUTION PATHWAY</SectionTitle>
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="PROPOSED SOLUTION" height="40px" cols={2} />
      <FieldBox label="ESTIMATED RESOLUTION" height="40px" />
    </div>
  </PageWrapper>
);

const IssueCheckpoint = () => (
  <PageWrapper title="ISSUE ANALYSIS & CHECKPOINT">
    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-end' }}>
      <FieldBox label="ISSUE ID" height="22px" />
      <FieldBox label="RELATED PROJECT" height="22px" cols={2} />
      <FieldBox label="DATE LOGGED" height="22px" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '8px' }}>
        <span style={{ fontSize: '8px', color: gold }}>PRIORITY:</span>
        {['LOW', 'MED', 'HIGH', 'CRIT'].map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <div style={{ width: '9px', height: '9px', border: `1px solid ${navy}` }}></div>
            <span style={{ fontSize: '6px' }}>{p}</span>
          </div>
        ))}
      </div>
    </div>

    <SectionTitle>ISSUE DESCRIPTION</SectionTitle>
    <FieldBox label="DETAILED PROBLEM STATEMENT" height="50px" />
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
      <div>
        <SectionTitle>CONTEXT & DISCOVERY</SectionTitle>
        <FieldBox label="HOW WAS THIS DISCOVERED?" height="34px" />
        <FieldBox label="ENVIRONMENTAL FACTORS" height="34px" />
        <FieldBox label="RELATED SYSTEMS / DEPENDENCIES" height="34px" />
      </div>
      <div>
        <SectionTitle>IMPACT ASSESSMENT</SectionTitle>
        <FieldBox label="IMMEDIATE EFFECTS" height="34px" />
        <FieldBox label="DOWNSTREAM IMPLICATIONS" height="34px" />
        <FieldBox label="STAKEHOLDERS AFFECTED" height="34px" />
      </div>
    </div>

    <SectionTitle>ATTEMPTED SOLUTIONS</SectionTitle>
    <div style={{ border: `1px solid ${navy}`, marginBottom: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 70px', background: navy, color: cream, fontSize: '7px' }}>
        <div style={{ padding: '4px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>DATE</div>
        <div style={{ padding: '4px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>APPROACH</div>
        <div style={{ padding: '4px', borderRight: `1px solid ${gold}`, textAlign: 'center' }}>RESULT</div>
        <div style={{ padding: '4px', textAlign: 'center' }}>VIABLE?</div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 70px', borderTop: `1px solid ${lightGold}` }}>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, height: '24px', background: 'white' }}></div>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, background: 'white' }}></div>
          <div style={{ padding: '4px', borderRight: `1px solid ${lightGold}`, background: 'white' }}></div>
          <div style={{ padding: '4px', background: 'white', textAlign: 'center', fontSize: '8px' }}>☐ Y ☐ N</div>
        </div>
      ))}
    </div>

    <SectionTitle>RESOLUTION STRATEGY</SectionTitle>
    <FieldBox label="RECOMMENDED PATH FORWARD" height="42px" />
    <div style={{ display: 'flex', gap: '10px' }}>
      <FieldBox label="PREREQUISITES / BLOCKERS" height="30px" />
      <FieldBox label="TARGET RESOLUTION DATE" height="30px" />
    </div>
  </PageWrapper>
);

const BusinessCards = () => (
  <div style={{ padding: '30px', background: '#2a2a2a', minHeight: '100%', fontFamily: 'system-ui' }}>
    <h2 style={{ textAlign: 'center', fontSize: '14px', color: cream, letterSpacing: '2px', marginBottom: '30px' }}>BUSINESS CARD CONCEPTS</h2>
    <p style={{ textAlign: 'center', fontSize: '10px', color: gold, marginBottom: '30px' }}>Standard 3.5" × 2" — Print on cardstock</p>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
      {/* Card 1 - Classical Minimal */}
      <div>
        <p style={{ color: gold, fontSize: '10px', marginBottom: '8px', textAlign: 'center', letterSpacing: '2px' }}>CONCEPT I: CLASSICAL MINIMAL</p>
        <div style={{ width: '350px', height: '200px', background: cream, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '36px', height: '36px', border: `2px solid ${gold}`, marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span style={{ color: gold, fontSize: '12px', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>DSS</span>
              </div>
            </div>
            <div style={{ borderBottom: `1px solid ${gold}`, paddingBottom: '8px', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: navy, letterSpacing: '2px', margin: 0, fontFamily: 'Georgia, serif' }}>DIGITAL SOVEREIGN SOCIETY</h3>
              <p style={{ fontSize: '6px', color: gold, letterSpacing: '2px', margin: '3px 0 0 0' }}>SOVEREIGNTY THROUGH KNOWLEDGE</p>
            </div>
            <p style={{ fontSize: '13px', color: navy, margin: '0 0 3px 0', fontFamily: 'Georgia, serif', fontWeight: '600' }}>William Hunter Laustrup</p>
            <p style={{ fontSize: '8px', color: gold, margin: 0, letterSpacing: '1px' }}>CO-FOUNDER & DIRECTOR</p>
          </div>
          <div style={{ fontSize: '7px', color: navy, textAlign: 'center', borderTop: `1px solid ${lightGold}`, paddingTop: '8px' }}>
            <p style={{ margin: '0 0 2px 0', letterSpacing: '0.5px' }}>A+W G.N.O.S.I.S. · Global Network for Optimized Sovereign Information Systems</p>
            <p style={{ margin: 0 }}>info@digitalsovereign.org · 557-203-7055</p>
          </div>
        </div>
      </div>

      {/* Card 2 - Geometric Bold */}
      <div>
        <p style={{ color: gold, fontSize: '10px', marginBottom: '8px', textAlign: 'center', letterSpacing: '2px' }}>CONCEPT II: GEOMETRIC PRESENCE</p>
        <div style={{ width: '350px', height: '200px', background: navy, padding: '20px', display: 'flex', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', border: `1px solid ${gold}`, opacity: 0.2, transform: 'translate(25px, -25px)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: '30px', width: '60px', height: '60px', border: `1px solid ${gold}`, opacity: 0.15, transform: 'translateY(15px)' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '-20px', width: '40px', height: '40px', border: `1px solid ${gold}`, opacity: 0.1 }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: '36px', height: '36px', border: `2px solid ${gold}`, marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <span style={{ color: gold, fontSize: '12px', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>DSS</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: cream, margin: '0 0 3px 0', fontFamily: 'Georgia, serif', fontWeight: '600' }}>William Hunter Laustrup</p>
              <p style={{ fontSize: '7px', color: gold, margin: 0, letterSpacing: '2px' }}>CO-FOUNDER & DIRECTOR</p>
            </div>
            <div style={{ borderTop: `1px solid ${gold}`, paddingTop: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: cream, margin: '0 0 5px 0', letterSpacing: '1px', fontFamily: 'Georgia, serif' }}>DIGITAL SOVEREIGN SOCIETY</p>
              <p style={{ fontSize: '6px', color: gold, margin: '0 0 3px 0', letterSpacing: '0.5px' }}>A+W G.N.O.S.I.S. · Global Network for Optimized Sovereign Information Systems</p>
              <p style={{ fontSize: '8px', color: cream, margin: 0 }}>info@digitalsovereign.org · 557-203-7055</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductivitySuite() {
  const [page, setPage] = useState('outline');
  const pages = [
    { id: 'outline', label: 'Project Outline' },
    { id: 'daily', label: 'Daily Planner' },
    { id: 'weekly', label: 'Weekly Planner' },
    { id: 'monthly', label: 'Monthly Calendar' },
    { id: 'progress', label: 'Progress Tracker' },
    { id: 'issue', label: 'Issue Checkpoint' },
    { id: 'cards', label: 'Business Cards' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a' }}>
      <div style={{ background: navy, padding: '10px 20px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', borderBottom: `2px solid ${gold}` }}>
        {pages.map(p => (
          <button
            key={p.id}
            onClick={() => setPage(p.id)}
            style={{
              background: page === p.id ? gold : 'transparent',
              color: page === p.id ? navy : cream,
              border: `1px solid ${gold}`,
              padding: '5px 10px',
              fontSize: '9px',
              letterSpacing: '1px',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: '816px', margin: '0 auto', minHeight: '1056px', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        {page === 'outline' && <ProjectOutline />}
        {page === 'daily' && <DailyPlanner />}
        {page === 'weekly' && <WeeklyPlanner />}
        {page === 'monthly' && <MonthlyOverview />}
        {page === 'progress' && <ProgressTracker />}
        {page === 'issue' && <IssueCheckpoint />}
        {page === 'cards' && <BusinessCards />}
      </div>
      <div style={{ textAlign: 'center', padding: '15px', color: gold, fontSize: '9px', letterSpacing: '1px' }}>
        PRINT: Select page → Ctrl/Cmd + P → Set margins to "None" or "Minimum" → Print
      </div>
    </div>
  );
}
