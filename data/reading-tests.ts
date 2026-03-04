export type ReadingPassage = {
  id: "p1" | "p2" | "p3";
  title: string;
  text: string;
};

type BaseQuestion = {
  id: string;
  number: number;
  passageId: ReadingPassage["id"];
  prompt: string;
  groupTitle: string;
  groupInstruction?: string;
};

export type ReadingQuestion =
  | (BaseQuestion & { type: "tfng"; options: ["TRUE", "FALSE", "NOT GIVEN"] })
  | (BaseQuestion & { type: "mcq"; options: string[] })
  | (BaseQuestion & { type: "matchingHeadings"; target: string; headingOptions: string[] })
  | (BaseQuestion & { type: "sentenceCompletion"; blanks: number })
  | (BaseQuestion & { type: "matchingInfo"; paragraphOptions: string[] });

export type ReadingFullTest = {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
};

const TFNG: ["TRUE", "FALSE", "NOT GIVEN"] = ["TRUE", "FALSE", "NOT GIVEN"];
const PARS = ["A", "B", "C", "D", "E", "F"];

const tfng = (id: string, number: number, passageId: ReadingPassage["id"], groupTitle: string, prompt: string, groupInstruction?: string): ReadingQuestion => ({
  id, number, passageId, type: "tfng", groupTitle, groupInstruction, prompt, options: TFNG
});
const mcq = (id: string, number: number, passageId: ReadingPassage["id"], groupTitle: string, prompt: string, options: string[], groupInstruction?: string): ReadingQuestion => ({
  id, number, passageId, type: "mcq", groupTitle, groupInstruction, prompt, options
});
const mh = (id: string, number: number, passageId: ReadingPassage["id"], groupTitle: string, target: string, headingOptions: string[], groupInstruction?: string): ReadingQuestion => ({
  id, number, passageId, type: "matchingHeadings", groupTitle, groupInstruction, prompt: target, target, headingOptions
});
const sc = (id: string, number: number, passageId: ReadingPassage["id"], groupTitle: string, prompt: string, groupInstruction?: string): ReadingQuestion => ({
  id, number, passageId, type: "sentenceCompletion", groupTitle, groupInstruction, prompt, blanks: 1
});
const mi = (id: string, number: number, passageId: ReadingPassage["id"], groupTitle: string, prompt: string, groupInstruction?: string): ReadingQuestion => ({
  id, number, passageId, type: "matchingInfo", groupTitle, groupInstruction, prompt, paragraphOptions: PARS
});

export const READING_TESTS: ReadingFullTest[] = [
  {
    id: "cambridge-16-test-2",
    title: "Cambridge IELTS 16 Test 2",
    durationMinutes: 60,
    totalQuestions: 40,
    passages: [
      {
        id: "p1",
        title: "Rainforest Recovery after Fire",
        text: `A. Tropical rainforests can recover after a single low-intensity fire, but ecologists emphasize that resilience has limits. In the first years after disturbance, regrowth can look rapid because pioneer plants fill open gaps and produce dense green cover. Yet this visual recovery may hide structural loss: canopy layering changes, slow-growing species decline, and humidity near the forest floor drops.

B. Recovery speed depends heavily on landscape connectivity. When burned sites remain close to intact forest, birds, bats, and mammals transport seeds that restore species diversity. Where fire occurs in fragmented areas surrounded by roads or pasture, regeneration is slower and often less diverse. In such places, invasive grasses may dominate early regrowth and increase fuel loads, raising the probability of repeated fire.

C. Soil response also follows a short-term and long-term pattern. After one burn, ash can briefly increase available nutrients, creating temporary fertility. However, repeated burning removes litter, weakens root systems, and exposes topsoil to erosion. Microbial communities that drive decomposition and nutrient cycling are especially vulnerable to heat and moisture loss. Once these systems decline, visible regrowth may continue while ecosystem quality falls.

D. Water dynamics shift after repeated canopy damage. More sunlight reaches the ground, evaporation rises, and shallow soils dry earlier in the season. Streams in disturbed areas can warm, affecting amphibians and insects adapted to stable conditions. These hydrological changes reduce the ability of young trees to survive dry periods, which further delays restoration in already degraded zones.

E. Human land-use decisions determine whether recovery is protected or interrupted. Where agencies enforce anti-burning rules, restore habitat corridors, and restrict rapid conversion to pasture, forests regain complexity more successfully. By contrast, repeated clearing after fire can lock landscapes into low-diversity states. Current restoration practice therefore combines passive protection with targeted interventions, including invasive-grass control and native planting.

F. Research now supports cautious optimism rather than fatalism. Rainforests are not uniformly fragile, but they are not infinitely self-repairing either. Recovery is strongest when one disturbance is followed by long protection, neighboring intact habitat, and coordinated local governance. Where repeated burns, fragmentation, and weak enforcement coincide, resilience declines sharply despite temporary green regrowth.`
      },
      {
        id: "p2",
        title: "Mapping Endangered Languages",
        text: `A. Endangered-language mapping has shifted from static atlases to dynamic digital systems that combine archival data, field interviews, and geospatial analysis. Instead of showing a language as a fixed point on a map, newer platforms track how usage changes across generations, schools, migration routes, and public services. This approach helps policymakers and educators identify where revitalization is urgent and where transmission remains comparatively stable.

B. Dynamic maps can include audio samples, age distribution, and domain-specific use, such as home conversation, classroom instruction, or ceremonial speech. These layers reveal patterns that national census categories often miss. A community may identify strongly with a language while daily fluency declines, or reported "home language" may differ by age group and season. For this reason, map builders treat administrative data as preliminary evidence.

C. Verification increasingly depends on local collaboration. Teachers, community media groups, and cultural organizations help researchers distinguish passive understanding from active use. Local partners can also identify vocabulary loss in specialized domains like agriculture, law, and ecology, where language vitality may weaken before everyday conversation disappears. Co-designed data categories generally produce more accurate representation than externally imposed templates.

D. Ethical considerations are central to map publication. Displaying exact coordinates for small communities may expose vulnerable groups to land disputes, extraction pressure, or unwanted media attention. Many teams therefore publish regional markers publicly while storing precise metadata in protected systems. This balances visibility with safety and reflects a broader shift toward community-controlled data governance.

E. Youth training programs have become a practical extension of this model. Instead of relying only on visiting researchers, projects train local students to record interviews, annotate place names, and maintain map databases. This creates long-term capacity and keeps updates active after pilot funding ends. It also strengthens trust, because language documentation remains under local stewardship.

F. The strongest mapping programs now integrate technology, ethics, and policy design. Maps are not neutral snapshots; they shape resource allocation, public narratives, and education strategy. When verification is rigorous and disclosure is responsible, digital mapping can support revitalization. When data quality is weak or governance is extractive, the same tools can misrepresent communities and undermine protection efforts.`
      },
      {
        id: "p3",
        title: "Neural Interfaces and Everyday Technology",
        text: `A. Brain-computer interfaces (BCIs) are moving from laboratory trials into practical clinical use. In controlled medical settings, some users with severe mobility limits can now select words, control assistive devices, and operate connected tools through decoded neural signals. These achievements are significant, but they do not imply that everyday consumer performance is already reliable under normal home or workplace conditions.

B. Signal stability remains a central engineering challenge. Neural data quality changes with fatigue, electrode placement, medication, and ambient electrical noise. Models trained in short sessions may degrade when context changes, requiring frequent recalibration. Because of this variability, many developers view near-term BCIs as hybrid tools that work alongside speech, keyboard, or touch input rather than replacing them entirely.

C. Commercial investment has increased rapidly, especially in wellness and productivity products. Experts caution that marketing often highlights best-case demonstrations while underreporting failure rates outside controlled environments. Standardized testing and clearer disclosure rules are therefore becoming policy priorities, particularly where device claims influence consumer safety or access to essential services.

D. Privacy and consent concerns are unusually sensitive in this field. Depending on processing methods, neural signals may reveal attention patterns, intention cues, or other high-value behavioral data. Even noisy raw signals can become revealing when combined with large inference models. Legal scholars argue that current data law may not be sufficient for continuous neural monitoring and reuse.

E. Policymakers are debating whether neurotechnology requires special protections beyond existing digital-privacy frameworks. Proposed safeguards include narrow purpose limits, stronger opt-in requirements, and independent model audits for high-stakes use. At the same time, researchers emphasize equity: if costs remain high and support systems remain scarce, benefits may concentrate in wealthier settings.

F. Most forecasts are therefore pragmatic. BCIs are likely to expand meaningful capability in assistive and specialized environments, while mainstream adoption will depend on reliability, governance, and affordability improvements. In the near term, the most realistic role is complementary input, not total replacement of established tools.`
      }
    ],
    questions: [
      tfng("c16t2-q1",1,"p1","Questions 1-5","Rainforests never recover after fire.","Do the following statements agree with the information given in Reading Passage 1?"),
      tfng("c16t2-q2",2,"p1","Questions 1-5","Nearby intact forest can support faster ecological recovery."),
      tfng("c16t2-q3",3,"p1","Questions 1-5","Repeated fires may reduce soil quality over time."),
      tfng("c16t2-q4",4,"p1","Questions 1-5","Fragmented landscapes usually regain diversity more quickly."),
      tfng("c16t2-q5",5,"p1","Questions 1-5","Post-fire land use influences long-term regeneration."),
      mh("c16t2-q6",6,"p1","Questions 6-9","Section A",["i. Limits of ecological resilience","ii. Seed dispersal from neighboring forests","iii. Contrasting short- and long-term soil effects","iv. Governance choices after disturbance","v. Complete immunity to repeated burning"],"Choose the correct heading for each section from the list below."),
      mh("c16t2-q7",7,"p1","Questions 6-9","Section B",["i. Limits of ecological resilience","ii. Seed dispersal from neighboring forests","iii. Contrasting short- and long-term soil effects","iv. Governance choices after disturbance","v. Complete immunity to repeated burning"]),
      mh("c16t2-q8",8,"p1","Questions 6-9","Section C",["i. Limits of ecological resilience","ii. Seed dispersal from neighboring forests","iii. Contrasting short- and long-term soil effects","iv. Governance choices after disturbance","v. Complete immunity to repeated burning"]),
      mh("c16t2-q9",9,"p1","Questions 6-9","Section D",["i. Limits of ecological resilience","ii. Seed dispersal from neighboring forests","iii. Contrasting short- and long-term soil effects","iv. Governance choices after disturbance","v. Complete immunity to repeated burning"]),
      mcq("c16t2-q10",10,"p1","Questions 10-13","Which condition most supports richer recovery?",["A. Immediate re-clearing","B. Nearby unburned habitat","C. Repeated grazing","D. Permanent ash cover"],"Choose the correct letter, A, B, C or D."),
      mcq("c16t2-q11",11,"p1","Questions 10-13","What does the text say about ash after a first fire?",["A. Always harmful","B. Temporarily useful for nutrients","C. No measurable effect","D. Causes instant erosion"]),
      sc("c16t2-q12",12,"p1","Questions 10-13","In highly __________ landscapes, recovery tends to be slower."),
      sc("c16t2-q13",13,"p1","Questions 10-13","Repeated fires can damage soil __________ communities."),

      mi("c16t2-q14",14,"p2","Questions 14-17","Reference to risks of publishing precise location data.","Which section of Reading Passage 2 contains the following information?"),
      mi("c16t2-q15",15,"p2","Questions 14-17","Comparison of static and continuously updated mapping methods."),
      mi("c16t2-q16",16,"p2","Questions 14-17","Mention of census limitations for estimating fluency."),
      mi("c16t2-q17",17,"p2","Questions 14-17","Description of training local youth to maintain language records."),
      mcq("c16t2-q18",18,"p2","Questions 18-21","A key benefit of dynamic maps is that they",["A. remove fieldwork","B. update social change over time","C. ignore migration","D. require no validation"],"Choose the correct letter, A, B, C or D."),
      mcq("c16t2-q19",19,"p2","Questions 18-21","Why do teams work with community educators?",["A. To reduce translation cost","B. To verify and contextualize data","C. To avoid recording audio","D. To replace geospatial tools"]),
      mcq("c16t2-q20",20,"p2","Questions 18-21","Why might projects use regional markers instead of exact coordinates?",["A. Faster internet speed","B. Lower map resolution","C. To protect vulnerable communities","D. To avoid local languages"]),
      mcq("c16t2-q21",21,"p2","Questions 18-21","The passage presents mapping mainly as",["A. tourism promotion","B. revitalization support","C. script simplification","D. machine translation testing"]),
      sc("c16t2-q22",22,"p2","Questions 22-26","New maps can include recordings from different __________.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c16t2-q23",23,"p2","Questions 22-26","Some census categories fail to capture true __________."),
      sc("c16t2-q24",24,"p2","Questions 22-26","Ethical design can require less precise __________ markers."),
      sc("c16t2-q25",25,"p2","Questions 22-26","Community participation improves data __________."),
      sc("c16t2-q26",26,"p2","Questions 22-26","Local teams help shape how linguistic __________ is represented."),

      tfng("c16t2-q27",27,"p3","Questions 27-31","Most BCIs today are deployed as everyday consumer tools.","Do the following statements agree with the information given in Reading Passage 3?"),
      tfng("c16t2-q28",28,"p3","Questions 27-31","Medical contexts currently provide the clearest practical evidence."),
      tfng("c16t2-q29",29,"p3","Questions 27-31","Experts agree consumer reliability is already solved."),
      tfng("c16t2-q30",30,"p3","Questions 27-31","Neural data can raise privacy concerns."),
      tfng("c16t2-q31",31,"p3","Questions 27-31","The text predicts keyboards will soon disappear."),
      mh("c16t2-q32",32,"p3","Questions 32-35","Section C",["i. Clinical impact evidence","ii. Uncertainty in consumer deployment","iii. Regulatory adequacy debate","iv. Equity and access issues","v. Full replacement of existing tools"],"Choose the correct heading for each section from the list below."),
      mh("c16t2-q33",33,"p3","Questions 32-35","Section D",["i. Clinical impact evidence","ii. Uncertainty in consumer deployment","iii. Regulatory adequacy debate","iv. Equity and access issues","v. Full replacement of existing tools"]),
      mh("c16t2-q34",34,"p3","Questions 32-35","Section E",["i. Clinical impact evidence","ii. Uncertainty in consumer deployment","iii. Regulatory adequacy debate","iv. Equity and access issues","v. Full replacement of existing tools"]),
      mh("c16t2-q35",35,"p3","Questions 32-35","Section F",["i. Clinical impact evidence","ii. Uncertainty in consumer deployment","iii. Regulatory adequacy debate","iv. Equity and access issues","v. Full replacement of existing tools"]),
      mcq("c16t2-q36",36,"p3","Questions 36-38","Which concern is highlighted around commercial claims?",["A. Overpromising near-term readiness","B. Lack of medical use","C. Excessive regulation","D. No research interest"],"Choose the correct letter, A, B, C or D."),
      mcq("c16t2-q37",37,"p3","Questions 36-38","Why are policymakers discussing neuro-specific rules?",["A. To boost gaming profits","B. To protect sensitive neural data","C. To ban assistive tools","D. To remove consent forms"]),
      mcq("c16t2-q38",38,"p3","Questions 36-38","Near-term role of BCIs is most likely",["A. universal replacement","B. specialized complement","C. no practical use","D. only military control"]),
      sc("c16t2-q39",39,"p3","Questions 39-40","Signal processing improvements reduce interaction __________.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c16t2-q40",40,"p3","Questions 39-40","Accessibility goals aim to prevent __________ concentration.")
    ]
  },
  {
    id: "cambridge-18-test-2",
    title: "Cambridge IELTS 18 Test 2",
    durationMinutes: 60,
    totalQuestions: 40,
    passages: [
      {
        id: "p1",
        title: "Urban Gardens and Public Health",
        text: `A. Urban gardens are increasingly treated as part of public-health infrastructure rather than informal hobby projects. In districts with limited fresh-food access, municipalities now support cultivation through land-use agreements, water subsidies, and technical extension programs. This shift reflects evidence that local food environments influence dietary behavior, especially where transport and income barriers limit regular access to affordable produce.

B. Program design strongly affects outcomes. Projects focused only on produce distribution often show modest short-term gains, while programs that combine gardening with regular cooking workshops and nutrition practice tend to report stronger and longer-lasting dietary improvement. Participants who learn planning, storage, and meal preparation are more likely to maintain behavior change after seasonal harvest fluctuations.

C. Results remain uneven across neighborhoods. Stable leadership, routine maintenance, and predictable funding are common features of successful sites. Where staff turnover is high or grants are short-term, gardens frequently decline after initial enthusiasm. Researchers emphasize that failure is usually cumulative: weak governance, volunteer fatigue, and unclear responsibilities compound each other over time.

D. Economic structure introduces further variation. Community gardens prioritize shared access and social value, while commercial urban farms operate with revenue targets and higher operating costs. Neither model is universally better. Community sites may face continuity risk, whereas commercial sites can struggle to keep prices accessible. Hybrid models, such as school partnerships or municipal purchase agreements, are increasingly used to balance mission and financial stability.

E. Integration with health services appears especially valuable. Some cities link clinics and local gardens through referral programs, allowing patients with diet-related risk factors to join structured food and cooking sessions. Early evaluations suggest this improves attendance and follow-through compared with stand-alone outreach. Schools, youth centers, and community kitchens can reinforce similar pathways.

F. Long-term performance depends on policy coordination. Land tenure insecurity, water pricing, and liability rules often prevent expansion in areas that could benefit most. Successful cities align food planning with zoning, education, and preventive-health strategy. Evidence now supports a balanced conclusion: urban gardens can improve diet and community resilience, but only when supported by durable institutions rather than short pilot cycles.`
      },
      {
        id: "p2",
        title: "Solar Architecture in Hot Climates",
        text: `A. In hot climates, high-performing solar architecture begins with load reduction, not panel installation. Designers first minimize heat gain through orientation, shading depth, facade geometry, and envelope performance. This sequence is essential because reducing cooling demand lowers system size requirements and improves operational resilience during heat extremes or grid stress.

B. Passive cooling strategies remain fundamental. Courtyards, cross-ventilation paths, and ventilated facades can significantly reduce indoor temperatures when adapted to local humidity and wind patterns. Materials also matter: thermal mass, reflective surfaces, and insulation must be selected according to daily temperature swing rather than copied from unrelated climates.

C. Simulation tools help compare design options early, but results depend on realistic assumptions about occupancy and maintenance. A model that performs well under ideal operation may underperform if filters are not replaced, shading devices are misused, or controls are poorly calibrated. Post-occupancy evaluation is therefore increasingly recommended for large public projects.

D. Photovoltaic output is sensitive to heat and dust. In many hot regions, panel temperature and surface soiling reduce real-world generation below nominal ratings. Cleaning routines, inverter quality, and grid constraints can determine whether projected payback is achieved. Ignoring these operational factors leads to overly optimistic feasibility estimates.

E. Current best practice combines passive and active measures with smart controls that shift demand away from peak periods. However, controls cannot compensate for weak core design. Buildings with poor orientation and inadequate shading remain expensive to cool even when automation is advanced. Integrated planning consistently outperforms single-component optimization.

F. Adoption is often constrained by upfront capital cost, even when lifecycle savings are favorable. Policy incentives, low-interest financing, and training standards for installers can improve implementation quality and financial viability. The long-term lesson is clear: effective solar architecture in hot climates is a systems strategy linking design, operation, and governance.`
      },
      {
        id: "p3",
        title: "Behavioral Economics in Daily Decisions",
        text: `A. Behavioral economics studies predictable gaps between ideal rational choice and real human decision-making. Instead of assuming perfect optimization, it examines how framing, effort, and attention shape everyday behavior. These patterns help explain why people delay beneficial actions, avoid switching to better options, or respond differently to equivalent gains and losses.

B. Loss aversion is one of the most robust findings: potential losses are typically weighted more heavily than equal gains. This can produce inertia in savings, insurance, and health decisions, even when objective benefits are clear. Default effects are similarly powerful; participation often rises when useful options are pre-selected and easy opt-out remains available.

C. These tools can improve outcomes, but ethical design is essential. Critics argue that behavioral interventions become manipulative when structure is hidden or consent is unclear. Supporters respond that every system has a default, so the key issue is transparency, reversibility, and alignment with public welfare rather than private extraction.

D. Field studies show that small design changes, such as message timing or form simplification, can produce meaningful aggregate effects. However, replication has shown strong context dependence. A successful intervention in one city may fail elsewhere because institutions, language norms, trust levels, and service quality differ.

E. As a result, researchers now emphasize iterative testing and long-term evaluation rather than one-time pilot success. Distributional impact is also a priority: average improvement can mask widening inequality if benefits accrue mainly to already advantaged groups. Public agencies increasingly include fairness checks in behavioral-policy assessment.

F. The strongest consensus is that nudges are useful but limited. They work best when paired with structural policy, such as service quality improvements and affordability reforms. Behavioral design can reduce friction and improve uptake, but durable outcomes usually require broader institutional support and continued accountability.`
      }
    ],
    questions: [
      tfng("c18t2-q1",1,"p1","Questions 1-5","Urban gardens are still treated only as informal hobbies.","Do the following statements agree with the information given in Reading Passage 1?"),
      tfng("c18t2-q2",2,"p1","Questions 1-5","Workshop-based programs are linked to better dietary outcomes."),
      tfng("c18t2-q3",3,"p1","Questions 1-5","The passage claims every garden project succeeds if volunteers are involved."),
      tfng("c18t2-q4",4,"p1","Questions 1-5","Commercial urban farms always operate at lower cost than community gardens."),
      tfng("c18t2-q5",5,"p1","Questions 1-5","Coordinated policy support improves long-term stability."),
      mh("c18t2-q6",6,"p1","Questions 6-9","Section B",["i. Program design and behavior change","ii. Typical failure conditions","iii. Economic model pressures","iv. Institutional coordination","v. Historic rooftop farming origins"],"Choose the correct heading for each section from the list below."),
      mh("c18t2-q7",7,"p1","Questions 6-9","Section C",["i. Program design and behavior change","ii. Typical failure conditions","iii. Economic model pressures","iv. Institutional coordination","v. Historic rooftop farming origins"]),
      mh("c18t2-q8",8,"p1","Questions 6-9","Section D",["i. Program design and behavior change","ii. Typical failure conditions","iii. Economic model pressures","iv. Institutional coordination","v. Historic rooftop farming origins"]),
      mh("c18t2-q9",9,"p1","Questions 6-9","Section E",["i. Program design and behavior change","ii. Typical failure conditions","iii. Economic model pressures","iv. Institutional coordination","v. Historic rooftop farming origins"]),
      mcq("c18t2-q10",10,"p1","Questions 10-13","The writer views urban gardens as",["A. full replacements for social policy","B. useful but not automatic solutions","C. ineffective in all contexts","D. only suitable for commercial farming"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t2-q11",11,"p1","Questions 10-13","Hybrid revenue models are discussed because",["A. they can support sustainability","B. they eliminate labor costs","C. they avoid community roles","D. they replace health programs"]),
      sc("c18t2-q12",12,"p1","Questions 10-13","A frequent weakness in failed projects is unstable __________."),
      sc("c18t2-q13",13,"p1","Questions 10-13","Workshops are more effective than one-time produce __________."),

      mi("c18t2-q14",14,"p2","Questions 14-17","Statement that passive design should precede generation systems.","Which section of Reading Passage 2 contains the following information?"),
      mi("c18t2-q15",15,"p2","Questions 14-17","Reference to simulation replacing generic design assumptions."),
      mi("c18t2-q16",16,"p2","Questions 14-17","Note that maintenance quality affects photovoltaic output."),
      mi("c18t2-q17",17,"p2","Questions 14-17","Claim that incentives influence long-term adoption."),
      mcq("c18t2-q18",18,"p2","Questions 18-21","A common misunderstanding is that solar architecture",["A. is only rooftop panels","B. avoids passive cooling","C. ignores orientation","D. needs no grid"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t2-q19",19,"p2","Questions 18-21","Passive cooling can",["A. raise summer peak demand","B. lower cooling demand","C. replace all generation","D. remove simulation needs"]),
      mcq("c18t2-q20",20,"p2","Questions 18-21","Smart controls are valued because they",["A. remove maintenance needs","B. shift loads by time and price","C. reduce humidity directly","D. eliminate passive strategies"]),
      mcq("c18t2-q21",21,"p2","Questions 18-21","The text suggests high initial costs",["A. are never offset","B. may be offset over time","C. block all projects","D. only matter in cold climates"]),
      sc("c18t2-q22",22,"p2","Questions 22-26","Design begins with reducing heat __________.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c18t2-q23",23,"p2","Questions 22-26","Dust can reduce actual photovoltaic __________."),
      sc("c18t2-q24",24,"p2","Questions 22-26","Climate __________ helps localize design decisions."),
      sc("c18t2-q25",25,"p2","Questions 22-26","Combined passive-active strategy is treated as more __________."),
      sc("c18t2-q26",26,"p2","Questions 22-26","Policy support can accelerate technology __________."),

      tfng("c18t2-q27",27,"p3","Questions 27-31","Behavioral economics assumes perfect rationality.","Do the following statements agree with the information given in Reading Passage 3?"),
      tfng("c18t2-q28",28,"p3","Questions 27-31","Loss aversion can drive resistance to useful policy change."),
      tfng("c18t2-q29",29,"p3","Questions 27-31","Default enrollment usually reduces participation."),
      tfng("c18t2-q30",30,"p3","Questions 27-31","Interventions always transfer unchanged across cities."),
      tfng("c18t2-q31",31,"p3","Questions 27-31","Researchers now emphasize persistence and fairness."),
      mh("c18t2-q32",32,"p3","Questions 32-35","Section B",["i. Bias and asymmetric response","ii. Defaults and policy design","iii. Context-specific effects","iv. Nudges with structural policy","v. End of replication work"],"Choose the correct heading for each section from the list below."),
      mh("c18t2-q33",33,"p3","Questions 32-35","Section C",["i. Bias and asymmetric response","ii. Defaults and policy design","iii. Context-specific effects","iv. Nudges with structural policy","v. End of replication work"]),
      mh("c18t2-q34",34,"p3","Questions 32-35","Section D",["i. Bias and asymmetric response","ii. Defaults and policy design","iii. Context-specific effects","iv. Nudges with structural policy","v. End of replication work"]),
      mh("c18t2-q35",35,"p3","Questions 32-35","Section E",["i. Bias and asymmetric response","ii. Defaults and policy design","iii. Context-specific effects","iv. Nudges with structural policy","v. End of replication work"]),
      mcq("c18t2-q36",36,"p3","Questions 36-38","Critics of default design stress",["A. transparent ethics","B. no evaluation needed","C. full prohibition","D. private-only use"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t2-q37",37,"p3","Questions 36-38","Writer's view of nudges is that they",["A. replace structural policy","B. are helpful but limited","C. fail in all public settings","D. work only in finance"]),
      mcq("c18t2-q38",38,"p3","Questions 36-38","Replication matters because policymakers need",["A. faster headlines","B. long-term reliable effects","C. fewer field studies","D. one-time success only"]),
      sc("c18t2-q39",39,"p3","Questions 39-40","Default policies influence service __________.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c18t2-q40",40,"p3","Questions 39-40","Current evaluation includes long-term __________.")
    ]
  },
  {
    id: "cambridge-18-test-1",
    title: "Cambridge IELTS 18 Test 1",
    durationMinutes: 60,
    totalQuestions: 40,
    passages: [
      {
        id: "p1",
        title: "Glass in Human History",
        text: `A. The earliest manufactured glass appears in archaeological records as beads, inlays, and small decorative objects rather than practical household containers. Production required specialized furnace control and careful ingredient preparation, making glass a high-skill craft associated with elite exchange networks. In this period, visual effect and symbolic value were often more important than transparency or structural performance.

B. Early workshops in Mesopotamia and Egypt experimented with colorants, layered effects, and shaping techniques despite material inconsistency. Impurities in raw sand and ash-based fluxes limited clarity, but artisans achieved complex finishes through repeated heating and surface treatment. These products circulated widely, indicating that glass already held economic and cultural significance long before mass production.

C. Roman industry expanded both scale and application. Improved furnace practices and forming methods increased output of vessels and architectural components. Glass use in buildings became more common, although pane clarity remained limited by modern standards. Regional production quality varied, but the period marked a transition from rare prestige items toward broader functional use.

D. Medieval and early modern centers, especially Venice and Murano, refined recipes for clearer and more workable glass. Guild organization protected technical knowledge while supporting export markets. This balance between innovation and secrecy shaped European competition for centuries and positioned glass as both a craft and a strategic commercial commodity.

E. Industrialization transformed the sector by standardizing processes and reducing cost. Mechanized production increased consistency in sheet and container glass, enabling widespread architectural use and safer transport applications. New quality controls supported scaling while expanding access beyond elite buyers.

F. Twentieth-century advances extended glass into engineering domains such as laminates, precision optics, and fiber-optic communication. These applications required exceptional purity and process control, far beyond earlier craft conditions. Across its history, glass repeatedly shifted from decorative rarity to infrastructural necessity, adapting to changing technical and social needs.`
      },
      {
        id: "p2",
        title: "The Growth of Megacities",
        text: `A. Megacities grow through migration, economic concentration, and infrastructure expansion, but their trajectories differ sharply by governance quality. Population increase can create opportunity through labor-market depth and service concentration, yet rapid growth also magnifies housing, mobility, and public-health pressure when institutions fail to coordinate long-term planning.

B. Housing systems are usually the first stress point. Demand can outpace formal supply, pushing lower-income residents toward peripheral or informal settlements with weak services. This raises commute burdens and can lock workers into high time costs that reduce productivity. Cities that align land policy with transport investment generally manage this transition more effectively.

C. Transport strategy is central to urban performance. Integrated transit networks, combining rail, bus corridors, and walkable access, tend to outperform private-car-dominant models on congestion and inclusion. Car-first expansion can offer short-term flexibility but often produces long-term gridlock, air-quality decline, and unequal access to employment.

D. Density can reduce per-capita energy demand, but only when utilities and governance are reliable. Weak waste systems, pollution control gaps, and unreliable water infrastructure can erase environmental advantages and create substantial health risk. Urban form and service quality must therefore be assessed together rather than as separate policy domains.

E. Digital infrastructure has become another structural determinant. Uneven broadband access affects education continuity, labor participation, and access to government services. In many large cities, digital exclusion reinforces geographic inequality even when physical transport improves. Several metropolitan authorities now treat connectivity as essential public infrastructure.

F. Climate resilience adds further urgency. Heat, flood exposure, and drainage failure disproportionately affect dense districts with aging systems. Effective adaptation requires coordinated investment across housing, mobility, health, and environmental planning. The broader evidence suggests that megacity scale can be an advantage, but only where governance integrates growth with long-horizon infrastructure strategy.`
      },
      {
        id: "p3",
        title: "Language Strategy and Memory",
        text: `A. Language learning outcomes depend not only on total effort but on how that effort is distributed. Research consistently shows that spaced repetition, where review is scheduled across intervals, outperforms massed practice for durable retention. Cramming can produce short-term familiarity, but recall often decays quickly when retrieval is not revisited over time.

B. Retrieval strategy is equally important. Active recall tasks require learners to generate language from memory, which strengthens encoding more effectively than passive rereading. When students repeatedly test themselves with prompts, summaries, or translation cues, they build retrieval pathways that transfer better to real communication contexts.

C. Sleep plays a supporting cognitive role. Consolidation during sleep helps stabilize newly learned material, while chronic sleep restriction impairs both attention during study and accuracy during recall. For adult learners, inconsistent sleep can reduce gains even when total study hours remain high.

D. Motivation and context influence persistence as much as cognitive method. Learners are more likely to maintain routines when language practice connects to meaningful social or professional goals. Authentic use, even brief, reinforces relevance and supports longer-term engagement compared with purely abstract drills.

E. Current evidence-based teaching therefore combines spaced review, active recall, feedback, and communicative practice. No single method is sufficient in isolation. Effective programs sequence these elements so that memory strength, fluency, and confidence develop together.

F. A practical conclusion emerges: long-term progress depends on repeated cycles of effort, retrieval, use, and recovery. Time matters, but structure matters more. Learners and institutions that design routines around these principles achieve more stable outcomes and lower burnout than those relying mainly on volume-based study.`
      }
    ],
    questions: [
      tfng("c18t1-q1",1,"p1","Questions 1-5","The earliest glass was mainly architectural.","Do the following statements agree with the information given in Reading Passage 1?"),
      tfng("c18t1-q2",2,"p1","Questions 1-5","Roman advances increased glass production range."),
      tfng("c18t1-q3",3,"p1","Questions 1-5","Venetian methods were fully open-source across Europe."),
      tfng("c18t1-q4",4,"p1","Questions 1-5","Industrialization reduced cost and improved consistency."),
      tfng("c18t1-q5",5,"p1","Questions 1-5","Fiber optics predated the Roman period."),
      mh("c18t1-q6",6,"p1","Questions 6-9","Section B",["i. Roman scaling improvements","ii. Guarded craft knowledge in trade hubs","iii. Industrial diffusion of glass","iv. Decorative origins","v. Modern high-tech uses"],"Choose the correct heading for each section from the list below."),
      mh("c18t1-q7",7,"p1","Questions 6-9","Section C",["i. Roman scaling improvements","ii. Guarded craft knowledge in trade hubs","iii. Industrial diffusion of glass","iv. Decorative origins","v. Modern high-tech uses"]),
      mh("c18t1-q8",8,"p1","Questions 6-9","Section D",["i. Roman scaling improvements","ii. Guarded craft knowledge in trade hubs","iii. Industrial diffusion of glass","iv. Decorative origins","v. Modern high-tech uses"]),
      mh("c18t1-q9",9,"p1","Questions 6-9","Section E",["i. Roman scaling improvements","ii. Guarded craft knowledge in trade hubs","iii. Industrial diffusion of glass","iv. Decorative origins","v. Modern high-tech uses"]),
      mcq("c18t1-q10",10,"p1","Questions 10-13","Early glass production appears to have been",["A. household routine","B. specialist craft","C. machine automated","D. agriculture based"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t1-q11",11,"p1","Questions 10-13","Mainstream use expanded most during",["A. Bronze Age","B. Roman era","C. Industrial era","D. Medieval guild era"]),
      sc("c18t1-q12",12,"p1","Questions 10-13","Roman architectural glass still had limited __________."),
      sc("c18t1-q13",13,"p1","Questions 10-13","Venetian producers often kept methods __________."),

      mi("c18t1-q14",14,"p2","Questions 14-17","Reference to digital exclusion risk.","Which section of Reading Passage 2 contains the following information?"),
      mi("c18t1-q15",15,"p2","Questions 14-17","Claim that integrated transit can reduce congestion costs."),
      mi("c18t1-q16",16,"p2","Questions 14-17","Description of housing pressure from rapid growth."),
      mi("c18t1-q17",17,"p2","Questions 14-17","Argument for systems-level planning over isolated projects."),
      mcq("c18t1-q18",18,"p2","Questions 18-21","Megacity growth is often driven by",["A. migration and economic concentration","B. reduced education demand","C. shrinking infrastructure","D. universal remote work"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t1-q19",19,"p2","Questions 18-21","Dense urban form can",["A. lower per-capita energy use","B. remove governance needs","C. eliminate pollution","D. end transport demand"]),
      mcq("c18t1-q20",20,"p2","Questions 18-21","Private-car-only strategy is portrayed as",["A. always cheapest","B. generally less effective for congestion","C. best for resilience","D. superior for all districts"]),
      mcq("c18t1-q21",21,"p2","Questions 18-21","Final section emphasizes",["A. one-time projects","B. coordinated long-term investment","C. reduced health planning","D. climate adaptation delays"]),
      sc("c18t1-q22",22,"p2","Questions 22-26","Megacities exceed ten __________ people.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c18t1-q23",23,"p2","Questions 22-26","Rapid growth often strains urban __________ systems."),
      sc("c18t1-q24",24,"p2","Questions 22-26","Weak governance can undermine public health __________."),
      sc("c18t1-q25",25,"p2","Questions 22-26","Digital access gaps may create social __________."),
      sc("c18t1-q26",26,"p2","Questions 22-26","Resilience requires coordinated __________ across sectors."),

      tfng("c18t1-q27",27,"p3","Questions 27-31","Total study hours alone guarantee retention.","Do the following statements agree with the information given in Reading Passage 3?"),
      tfng("c18t1-q28",28,"p3","Questions 27-31","Spaced repetition and massed practice are different strategies."),
      tfng("c18t1-q29",29,"p3","Questions 27-31","Passive rereading is usually stronger than active recall."),
      tfng("c18t1-q30",30,"p3","Questions 27-31","Sleep restriction can harm retrieval accuracy."),
      tfng("c18t1-q31",31,"p3","Questions 27-31","Meaningful context can affect learner persistence."),
      mh("c18t1-q32",32,"p3","Questions 32-35","Section B",["i. Time-distributed review","ii. Retrieval-driven encoding","iii. Sleep and consolidation","iv. Motivation and context","v. Vocabulary volume only"],"Choose the correct heading for each section from the list below."),
      mh("c18t1-q33",33,"p3","Questions 32-35","Section C",["i. Time-distributed review","ii. Retrieval-driven encoding","iii. Sleep and consolidation","iv. Motivation and context","v. Vocabulary volume only"]),
      mh("c18t1-q34",34,"p3","Questions 32-35","Section D",["i. Time-distributed review","ii. Retrieval-driven encoding","iii. Sleep and consolidation","iv. Motivation and context","v. Vocabulary volume only"]),
      mh("c18t1-q35",35,"p3","Questions 32-35","Section E",["i. Time-distributed review","ii. Retrieval-driven encoding","iii. Sleep and consolidation","iv. Motivation and context","v. Vocabulary volume only"]),
      mcq("c18t1-q36",36,"p3","Questions 36-38","Massed practice is described as",["A. ideal for long-term retention","B. quick but less durable","C. always superior","D. unnecessary for beginners"],"Choose the correct letter, A, B, C or D."),
      mcq("c18t1-q37",37,"p3","Questions 36-38","Active recall helps because it",["A. removes effort","B. deepens encoding through retrieval","C. avoids feedback","D. replaces sleep"]),
      mcq("c18t1-q38",38,"p3","Questions 36-38","Final recommendation is to use",["A. integrated evidence-based routines","B. vocabulary lists only","C. no communication tasks","D. intensive cramming cycles"]),
      sc("c18t1-q39",39,"p3","Questions 39-40","Spaced repetition uses expanding __________.","Complete the sentences below with ONE WORD ONLY from the passage."),
      sc("c18t1-q40",40,"p3","Questions 39-40","Sleep loss weakens retrieval __________.")
    ]
  }
];

export function getReadingTestById(id: string) {
  return READING_TESTS.find((test) => test.id === id);
}
