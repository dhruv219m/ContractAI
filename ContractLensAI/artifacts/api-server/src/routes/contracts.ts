import { Router, type IRouter } from "express";
import {
  AnalyzeContractParams,
  ChatWithContractBody,
  ChatWithContractParams,
  CompareContractVersionsParams,
  GetContractObligationsParams,
  GetContractParams,
  GetContractReviewParams,
  GetContractTimelineParams,
  ResolveReviewItemBody,
  ResolveReviewItemParams,
  UploadContractBody,
  UploadContractVersionBody,
  UploadContractVersionParams,
} from "@workspace/api-zod";

type Evidence = {
  page: number;
  section: string;
  excerpt: string;
  sourceType: string;
};

type Obligation = {
  id: number;
  title: string;
  description: string;
  owner: string;
  status: string;
  dueDate: string;
  recurrence: string;
  confidence: number;
  evidence: Evidence;
  affectedByChange: boolean;
};

type Deadline = {
  id: number;
  date: string;
  title: string;
  type: string;
  status: string;
  owner: string;
  source: Evidence;
};

type ReviewItem = {
  id: number;
  issue: string;
  reason: string;
  severity: string;
  status: string;
  suggestedAction: string;
  evidence: Evidence;
  contractId: number;
};

type AgentAction = {
  id: number;
  agent: string;
  message: string;
  status: string;
  timestamp: string;
  contractId: number;
};

type Contract = {
  id: number;
  name: string;
  type: string;
  status: string;
  parties: { name: string; role: string }[];
  facts: { label: string; value: string; kind: string; evidence: Evidence }[];
  obligations: Obligation[];
  deadlines: Deadline[];
  reviews: ReviewItem[];
  versions: { id: number; label: string; filename: string; uploadedAt: string; isCurrent: boolean }[];
  activity: AgentAction[];
  comparison: {
    versionA: string;
    versionB: string;
    changes: {
      category: string;
      label: string;
      oldValue: string;
      newValue: string;
      sourceA: Evidence;
      sourceB: Evidence;
      affectedObligations: number[];
      downstreamImpact: string;
      requiresReview: boolean;
    }[];
    summary: string;
  } | null;
};

const evidence = (page: number, section: string, excerpt: string, sourceType = "contract") => ({
  page,
  section,
  excerpt,
  sourceType,
});

const now = new Date("2026-09-20T09:30:00.000Z");
const iso = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString().slice(0, 10);

const demoContract = (): Contract => {
  const contractId = 1;
  const obligations: Obligation[] = [
    {
      id: 1,
      title: "Submit monthly service report",
      description: "Northstar receives a service performance report within five business days of each month end.",
      owner: "Acme Technologies",
      status: "Open",
      dueDate: iso(15),
      recurrence: "Monthly",
      confidence: 0.98,
      evidence: evidence(8, "4.2 Service Reporting", "Supplier shall provide a monthly service report within five business days after month end."),
      affectedByChange: false,
    },
    {
      id: 2,
      title: "Maintain 99.5% service availability",
      description: "Acme must maintain the monthly service availability target and notify Northstar of incidents.",
      owner: "Acme Technologies",
      status: "Monitoring",
      dueDate: iso(29),
      recurrence: "Monthly",
      confidence: 0.96,
      evidence: evidence(9, "5.1 Availability", "The service shall maintain monthly availability of not less than 99.5%."),
      affectedByChange: false,
    },
    {
      id: 3,
      title: "Pay recurring platform fee",
      description: "Northstar pays the recurring platform fee within 30 days of invoice.",
      owner: "Northstar Retail",
      status: "Open",
      dueDate: iso(10),
      recurrence: "Monthly",
      confidence: 0.99,
      evidence: evidence(6, "3.1 Fees", "Invoices are payable within thirty (30) days of the invoice date."),
      affectedByChange: true,
    },
    {
      id: 4,
      title: "Send non-renewal notice",
      description: "Either party must provide written notice before the automatic renewal window.",
      owner: "Either party",
      status: "Upcoming",
      dueDate: "2026-12-14",
      recurrence: "At renewal",
      confidence: 0.93,
      evidence: evidence(4, "2.3 Renewal", "This Agreement renews automatically unless either party provides sixty (60) days written notice."),
      affectedByChange: true,
    },
    {
      id: 5,
      title: "Complete annual security review",
      description: "Acme provides an annual security and access review summary.",
      owner: "Acme Technologies",
      status: "Open",
      dueDate: "2026-11-30",
      recurrence: "Annual",
      confidence: 0.9,
      evidence: evidence(11, "6.4 Security", "Supplier will make an annual security review summary available to Customer."),
      affectedByChange: false,
    },
  ];
  const deadlines: Deadline[] = [
    { id: 1, date: "2026-09-30", title: "Platform fee invoice due", type: "Payment", status: "Upcoming", owner: "Northstar Retail", source: obligations[2].evidence },
    { id: 2, date: "2026-10-05", title: "Monthly service report", type: "Report", status: "Upcoming", owner: "Acme Technologies", source: obligations[0].evidence },
    { id: 3, date: "2026-11-30", title: "Annual security review", type: "Review", status: "Upcoming", owner: "Acme Technologies", source: obligations[4].evidence },
    { id: 4, date: "2026-12-14", title: "Renewal notice window", type: "Renewal", status: "Needs attention", owner: "Either party", source: obligations[3].evidence },
  ];
  const reviews: ReviewItem[] = [
    {
      id: 1,
      contractId,
      issue: "Termination notice language is ambiguous",
      reason: "Section 7 uses “reasonable notice” for a service failure termination but does not define the notice period or cure window.",
      severity: "High",
      status: "Open",
      suggestedAction: "Confirm the intended notice and cure periods with the contract owner before relying on this clause.",
      evidence: evidence(12, "7.2 Termination for Cause", "Either party may terminate for a material service failure upon reasonable notice if the failure is not cured."),
    },
    {
      id: 2,
      contractId,
      issue: "Change-order approval path is not explicit",
      reason: "The agreement references written approval but does not identify an approval role at Northstar.",
      severity: "Medium",
      status: "Open",
      suggestedAction: "Assign an internal approver and record the operating procedure.",
      evidence: evidence(10, "5.4 Change Requests", "Additional work may be agreed in writing by the parties."),
    },
  ];
  const activity: AgentAction[] = [
    { id: 1, contractId, agent: "DocumentAgent", message: "Extracted 11 source-backed contract facts", status: "complete", timestamp: "2026-09-20T09:29:00.000Z" },
    { id: 2, contractId, agent: "ObligationAgent", message: "Detected 5 obligations and 4 deadlines", status: "complete", timestamp: "2026-09-20T09:29:12.000Z" },
    { id: 3, contractId, agent: "ReviewAgent", message: "Flagged 2 clauses for human review", status: "review", timestamp: "2026-09-20T09:29:18.000Z" },
    { id: 4, contractId, agent: "ActionAgent", message: "Created renewal and payment action plan", status: "complete", timestamp: "2026-09-20T09:29:24.000Z" },
  ];
  return {
    id: contractId,
    name: "Acme Technologies — Managed Services Agreement",
    type: "Managed Services Agreement",
    status: "Active · Review needed",
    parties: [
      { name: "Acme Technologies Pvt. Ltd.", role: "Service provider" },
      { name: "Northstar Retail Pvt. Ltd.", role: "Customer" },
    ],
    facts: [
      { label: "Effective date", value: "15 Jan 2026", kind: "date", evidence: evidence(2, "1.1 Term", "This Agreement is effective as of 15 January 2026.") },
      { label: "Expiration date", value: "14 Jan 2027", kind: "date", evidence: evidence(3, "2.1 Initial term", "The initial term ends on 14 January 2027.") },
      { label: "Renewal notice", value: "60 days", kind: "renewal", evidence: evidence(4, "2.3 Renewal", "Either party may prevent renewal with sixty (60) days written notice.") },
      { label: "Monthly platform fee", value: "₹70,000 + GST", kind: "payment", evidence: evidence(6, "3.1 Fees", "Customer will pay a monthly platform fee of ₹70,000 plus applicable taxes.") },
      { label: "Payment terms", value: "Net 30", kind: "payment", evidence: evidence(6, "3.1 Fees", "Invoices are payable within thirty (30) days of the invoice date.") },
      { label: "Service availability", value: "99.5% monthly", kind: "sla", evidence: evidence(9, "5.1 Availability", "The service shall maintain monthly availability of not less than 99.5%.") },
    ],
    obligations,
    deadlines,
    reviews,
    versions: [
      { id: 1, label: "Version 1", filename: "acme-managed-services-v1.pdf", uploadedAt: "2026-09-20T09:20:00.000Z", isCurrent: false },
      { id: 2, label: "Version 2", filename: "acme-managed-services-v2.pdf", uploadedAt: "2026-09-20T09:28:00.000Z", isCurrent: true },
    ],
    activity,
    comparison: {
      versionA: "Version 1",
      versionB: "Version 2",
      summary: "3 material changes detected. Payment and renewal actions were recalculated; termination wording remains a human-review item.",
      changes: [
        {
          category: "payment",
          label: "Monthly platform fee",
          oldValue: "₹70,000 + GST",
          newValue: "₹75,000 + GST",
          sourceA: evidence(6, "3.1 Fees", "Customer will pay a monthly platform fee of ₹70,000 plus applicable taxes."),
          sourceB: evidence(6, "3.1 Fees", "Customer will pay a monthly platform fee of ₹75,000 plus applicable taxes."),
          affectedObligations: [3],
          downstreamImpact: "Update recurring payment task and budget owner notification.",
          requiresReview: false,
        },
        {
          category: "renewal",
          label: "Renewal notice period",
          oldValue: "60 days",
          newValue: "90 days",
          sourceA: evidence(4, "2.3 Renewal", "Either party may prevent renewal with sixty (60) days written notice."),
          sourceB: evidence(4, "2.3 Renewal", "Either party may prevent renewal with ninety (90) days written notice."),
          affectedObligations: [4],
          downstreamImpact: "Move renewal notice deadline from 14 Nov to 16 Oct 2026.",
          requiresReview: true,
        },
        {
          category: "termination",
          label: "Termination for cause",
          oldValue: "30-day cure period",
          newValue: "Reasonable notice and cure period",
          sourceA: evidence(12, "7.2 Termination for Cause", "The defaulting party has thirty (30) days to cure a material breach."),
          sourceB: evidence(12, "7.2 Termination for Cause", "The defaulting party will be given reasonable notice and opportunity to cure."),
          affectedObligations: [],
          downstreamImpact: "No automatic deadline created; route to contract owner for interpretation.",
          requiresReview: true,
        },
      ],
    },
  };
};

const contracts: Contract[] = [demoContract()];
let nextContractId = 2;
let nextReviewId = 3;
let nextVersionId = 3;

const getContractOr404 = (id: number, res: Parameters<IRouter["get"]>[1] extends never ? never : any) => {
  const contract = contracts.find((item) => item.id === id);
  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return null;
  }
  return contract;
};

const toListItem = (contract: Contract) => {
  const renewal = contract.deadlines.find((item) => item.type === "Renewal");
  const daysToRenewal = renewal ? Math.max(0, Math.round((new Date(renewal.date).getTime() - now.getTime()) / 86_400_000)) : 0;
  return {
    id: contract.id,
    name: contract.name,
    type: contract.type,
    parties: contract.parties.map((party) => party.name.replace(" Pvt. Ltd.", "")),
    status: contract.status,
    renewalDate: "2027-01-14",
    daysToRenewal,
    obligationCount: contract.obligations.length,
    reviewCount: contract.reviews.filter((item) => item.status === "Open").length,
    version: contract.versions.length,
    updatedAt: contract.versions.at(-1)?.uploadedAt ?? now.toISOString(),
  };
};

const router: IRouter = Router();

router.get("/contracts", (_req, res) => res.json(contracts.map(toListItem)));

router.post("/contracts", (req, res) => {
  const input = UploadContractBody.parse(req.body);
  const isDemo = input.isDemo ?? true;
  const contract = demoContract();
  contract.id = nextContractId++;
  contract.name = isDemo ? "Acme Technologies — Managed Services Agreement" : input.filename.replace(/\.pdf$/i, "");
  contract.versions = [{ id: nextVersionId++, label: "Version 1", filename: input.filename, uploadedAt: now.toISOString(), isCurrent: true }];
  contract.activity = [{
    id: 50 + contract.id,
    contractId: contract.id,
    agent: "OrchestratorAgent",
    message: "Document queued for analysis",
    status: "processing",
    timestamp: now.toISOString(),
  }];
  contracts.push(contract);
  res.status(201).json(contract);
});

router.get("/contracts/:id", (req, res) => {
  const params = GetContractParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (contract) res.json(contract);
});

router.post("/contracts/:id/analyze", (req, res) => {
  const params = AnalyzeContractParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (!contract) return;
  contract.activity.unshift({
    id: Date.now(),
    contractId: contract.id,
    agent: "OrchestratorAgent",
    message: "Analysis complete: structured facts, obligations, deadlines, and review items are ready",
    status: "complete",
    timestamp: new Date().toISOString(),
  });
  res.json(contract);
});

router.get("/contracts/:id/obligations", (req, res) => {
  const params = GetContractObligationsParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (contract) res.json(contract.obligations);
});

router.get("/contracts/:id/timeline", (req, res) => {
  const params = GetContractTimelineParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (contract) res.json(contract.deadlines);
});

router.post("/contracts/:id/chat", (req, res) => {
  const params = ChatWithContractParams.parse({ id: Number(req.params.id) });
  const input = ChatWithContractBody.parse(req.body);
  const contract = getContractOr404(params.id, res);
  if (!contract) return;
  const question = input.question.toLowerCase();
  let answer = "I couldn't find sufficient evidence for that in the uploaded contract.";
  let answerEvidence: Evidence[] = [];
  let confidence = 0.42;
  let answerType = "not_found";
  if (question.includes("renew") || question.includes("notice")) {
    answer = "The current version requires 90 days' written notice to prevent automatic renewal. Based on the 14 January 2027 expiry date, the derived action deadline is 16 October 2026.";
    answerEvidence = [contract.comparison?.changes[1]?.sourceB ?? contract.facts[2].evidence];
    confidence = 0.98;
    answerType = "explicit_and_derived";
  } else if (question.includes("pay") || question.includes("payment") || question.includes("fee")) {
    answer = "The current version sets the monthly platform fee at ₹75,000 plus GST, payable within 30 days of invoice.";
    answerEvidence = [contract.comparison?.changes[0]?.sourceB ?? contract.facts[3].evidence, contract.facts[4].evidence];
    confidence = 0.99;
    answerType = "explicit";
  } else if (question.includes("vendor") || question.includes("acme") || question.includes("obligation")) {
    answer = "Acme is responsible for the monthly service report, maintaining 99.5% availability, and providing the annual security review summary.";
    answerEvidence = [contract.obligations[0].evidence, contract.obligations[1].evidence, contract.obligations[4].evidence];
    confidence = 0.96;
    answerType = "explicit";
  } else if (question.includes("terminat")) {
    answer = "The contract allows termination for a material service failure after reasonable notice and an opportunity to cure. The notice and cure period is ambiguous and is flagged for human review.";
    answerEvidence = [contract.reviews[0].evidence];
    confidence = 0.9;
    answerType = "explicit_with_review";
  }
  res.json({ question: input.question, answer, confidence, evidence: answerEvidence, answerType });
});

router.post("/contracts/:id/versions", (req, res) => {
  const params = UploadContractVersionParams.parse({ id: Number(req.params.id) });
  const input = UploadContractVersionBody.parse(req.body);
  const contract = getContractOr404(params.id, res);
  if (!contract) return;
  contract.versions.forEach((version) => { version.isCurrent = false; });
  const version = { id: nextVersionId++, label: `Version ${contract.versions.length + 1}`, filename: input.filename, uploadedAt: new Date().toISOString(), isCurrent: true };
  contract.versions.push(version);
  contract.activity.unshift({
    id: Date.now(),
    contractId: contract.id,
    agent: "ChangeDetectionAgent",
    message: "New version uploaded; material changes ready for comparison",
    status: "processing",
    timestamp: new Date().toISOString(),
  });
  res.status(201).json(version);
});

router.post("/contracts/:id/compare", (req, res) => {
  const params = CompareContractVersionsParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (!contract) return;
  if (!contract.comparison) {
    res.status(400).json({ error: "At least two versions are required to compare" });
    return;
  }
  contract.obligations.forEach((obligation) => { obligation.affectedByChange = [3, 4].includes(obligation.id); });
  contract.activity.unshift({
    id: Date.now(),
    contractId: contract.id,
    agent: "ChangeDetectionAgent",
    message: "3 material changes detected; 2 downstream actions affected",
    status: "complete",
    timestamp: new Date().toISOString(),
  });
  res.json(contract.comparison);
});

router.get("/contracts/:id/review", (req, res) => {
  const params = GetContractReviewParams.parse({ id: Number(req.params.id) });
  const contract = getContractOr404(params.id, res);
  if (contract) res.json(contract.reviews);
});

router.post("/review/:id/resolve", (req, res) => {
  const params = ResolveReviewItemParams.parse({ id: Number(req.params.id) });
  const input = ResolveReviewItemBody.parse(req.body);
  const review = contracts.flatMap((contract) => contract.reviews).find((item) => item.id === params.id);
  if (!review) {
    res.status(404).json({ error: "Review item not found" });
    return;
  }
  review.status = input.status;
  res.json(review);
});

export { contracts, toListItem };
export default router;