import { Router, type IRouter } from "express";
import { contracts, toListItem } from "./contracts";

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => {
  const allReviews = contracts.flatMap((contract) => contract.reviews);
  const timeline = contracts.flatMap((contract) => contract.deadlines).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const activity = contracts.flatMap((contract) => contract.activity).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  res.json({
    activeContracts: contracts.filter((contract) => contract.status.startsWith("Active")).length,
    upcomingObligations: contracts.reduce((total, contract) => total + contract.obligations.filter((obligation) => obligation.status !== "Complete").length, 0),
    requiresReview: allReviews.filter((review) => review.status === "Open").length,
    upcomingRenewals: contracts.filter((contract) => contract.deadlines.some((deadline) => deadline.type === "Renewal")).length,
    contracts: contracts.map(toListItem),
    timeline,
    reviewQueue: allReviews.filter((review) => review.status === "Open"),
    activity,
  });
});

router.get("/activity", (_req, res) => {
  res.json(contracts.flatMap((contract) => contract.activity).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
});

export default router;