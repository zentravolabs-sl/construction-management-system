import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BuildMaster ERP database...");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Subscription Plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { tier: "STARTER" },
    update: {},
    create: {
      name: "Starter Plan",
      tier: "STARTER",
      description: "For growing builders managing up to 5 active projects.",
      monthlyPriceLkr: 24500,
      annualPriceLkr: 245000,
      maxProjects: 5,
      maxUsers: 15,
      maxBranches: 1,
      maxStorageMb: 5120,
      hasInventory: false,
      hasBoq: true,
      hasContractors: false,
      hasFinance: false,
      hasClientPortal: false,
      hasAdvancedReports: false,
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { tier: "PROFESSIONAL" },
    update: {},
    create: {
      name: "Professional Plan",
      tier: "PROFESSIONAL",
      description: "Complete BOQ, Inventory, Contractors, Payroll & Accounting for mid-sized firms.",
      monthlyPriceLkr: 59000,
      annualPriceLkr: 590000,
      maxProjects: 25,
      maxUsers: 75,
      maxBranches: 5,
      maxStorageMb: 25600,
      hasInventory: true,
      hasBoq: true,
      hasContractors: true,
      hasFinance: true,
      hasClientPortal: true,
      hasAdvancedReports: true,
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { tier: "ENTERPRISE" },
    update: {},
    create: {
      name: "Enterprise Plan",
      tier: "ENTERPRISE",
      description: "Unlimited projects, multi-branch operations, client portal & priority engineering support.",
      monthlyPriceLkr: 125000,
      annualPriceLkr: 1250000,
      maxProjects: 999,
      maxUsers: 500,
      maxBranches: 25,
      maxStorageMb: 102400,
      hasInventory: true,
      hasBoq: true,
      hasContractors: true,
      hasFinance: true,
      hasClientPortal: true,
      hasAdvancedReports: true,
    },
  });

  // 2. Primary Organization: Apex Constructions Lanka (Pvt) Ltd
  const org = await prisma.organization.upsert({
    where: { slug: "apex-constructions-lanka" },
    update: {},
    create: {
      name: "Apex Constructions Lanka (Pvt) Ltd",
      slug: "apex-constructions-lanka",
      address: "No. 412, Galle Road, Kollupitiya",
      city: "Colombo 03",
      country: "Sri Lanka",
      businessRegistrationNumber: "PV-0084921",
      taxIdentificationNumber: "114908231-7000",
      email: "info@apexconstructions.lk",
      phone: "+94 11 234 5678",
      website: "https://apexconstructions.lk",
      currency: "LKR",
      timezone: "Asia/Colombo",
      dateFormat: "DD/MM/YYYY",
      defaultTaxRate: 18.0,
      allowNegativeStock: false,
      standardWorkingDaysPerMonth: 26,
      defaultOvertimeMultiplier: 1.5,
      onboardingCompleted: true,
    },
  });

  // Secondary Organization for Multi-Tenant Isolation & Super Admin Analytics
  const org2 = await prisma.organization.upsert({
    where: { slug: "ceylon-civil-engineering" },
    update: {},
    create: {
      name: "Ceylon Civil & Structural Engineering (Pvt) Ltd",
      slug: "ceylon-civil-engineering",
      address: "No. 88, Peradeniya Road",
      city: "Kandy",
      country: "Sri Lanka",
      businessRegistrationNumber: "PV-0091204",
      taxIdentificationNumber: "119204110-7000",
      email: "ops@ceyloncivil.lk",
      phone: "+94 81 222 4499",
      currency: "LKR",
      timezone: "Asia/Colombo",
      onboardingCompleted: true,
    },
  });

  // Subscriptions
  const existingSub1 = await prisma.subscription.findFirst({ where: { organizationId: org.id } });
  if (!existingSub1) {
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planId: enterprisePlan.id,
        status: "ACTIVE",
        billingCycle: "ANNUAL",
        trialStartsAt: new Date("2026-01-01"),
        trialEndsAt: new Date("2026-01-15"),
        currentPeriodStart: new Date("2026-01-15"),
        currentPeriodEnd: new Date("2027-01-15"),
        amountLkr: 1250000,
        paymentProvider: "PAYHERE",
        externalReference: "PH-LK-9988210",
      },
    });
  }

  const existingSub2 = await prisma.subscription.findFirst({ where: { organizationId: org2.id } });
  if (!existingSub2) {
    await prisma.subscription.create({
      data: {
        organizationId: org2.id,
        planId: proPlan.id,
        status: "TRIAL",
        billingCycle: "MONTHLY",
        trialStartsAt: new Date("2026-11-12"),
        trialEndsAt: new Date("2026-11-26"),
        currentPeriodStart: new Date("2026-11-12"),
        currentPeriodEnd: new Date("2026-11-26"),
        amountLkr: 59000,
        paymentProvider: "PAYHERE_SANDBOX",
      },
    });
  }

  // Branches
  const colomboBranch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "BR-CMB" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Colombo Head Office",
      code: "BR-CMB",
      address: "No. 412, Galle Road, Colombo 03",
      city: "Colombo",
      phone: "+94 11 234 5678",
      email: "colombo@apexconstructions.lk",
      isHeadOffice: true,
    },
  });

  const kandyBranch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "BR-KDY" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Central Province Regional Office",
      code: "BR-KDY",
      address: "No. 125, Katugastota Road, Kandy",
      city: "Kandy",
      phone: "+94 81 234 9000",
      email: "kandy@apexconstructions.lk",
      isHeadOffice: false,
    },
  });

  // Clients
  const client1 = await prisma.client.upsert({
    where: { organizationId_clientCode: { organizationId: org.id, clientCode: "CL-001" } },
    update: {},
    create: {
      organizationId: org.id,
      clientCode: "CL-001",
      clientType: "COMPANY",
      name: "Colombo Metro Properties PLC",
      companyName: "Colombo Metro Properties PLC",
      contactPerson: "Deshamanya Rohan Wijesekara",
      email: "client@colomboproperties.lk",
      phone: "+94 11 255 8899",
      address: "World Trade Center, West Tower, Level 24",
      city: "Colombo 01",
      nicOrBrn: "PQ-001129",
      taxNumber: "100992881-7000",
      portalEnabled: true,
      notes: "Tier-1 luxury high-rise residential & commercial developer.",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { organizationId_clientCode: { organizationId: org.id, clientCode: "CL-002" } },
    update: {},
    create: {
      organizationId: org.id,
      clientCode: "CL-002",
      clientType: "COMPANY",
      name: "Road Development Authority (Southern Express Division)",
      companyName: "RDA Sri Lanka",
      contactPerson: "Eng. Mahinda Senanayake",
      email: "projects@rda-demo.gov.lk",
      phone: "+94 11 286 2767",
      address: "Maganeguma Mahamedura, Battaramulla",
      city: "Colombo",
      nicOrBrn: "GOV-RDA-1981",
      portalEnabled: true,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { organizationId_clientCode: { organizationId: org.id, clientCode: "CL-003" } },
    update: {},
    create: {
      organizationId: org.id,
      clientCode: "CL-003",
      clientType: "COMPANY",
      name: "Serendib Heritage Hospitality Group",
      companyName: "Serendib Heritage Resorts (Pvt) Ltd",
      contactPerson: "Dilshan Fernando",
      email: "dilshan@serendibresorts.lk",
      phone: "+94 91 223 4455",
      address: "No. 24, Church Street, Galle Fort",
      city: "Galle",
      nicOrBrn: "PV-0044112",
      portalEnabled: true,
    },
  });

  // Users
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@buildmaster.lk" },
    update: {},
    create: {
      email: "superadmin@buildmaster.lk",
      passwordHash,
      fullName: "Kasun Perera (Platform Super Admin)",
      phone: "+94 77 100 2000",
      systemRole: "SUPER_ADMIN",
      emailVerified: new Date(),
    },
  });

  const companyAdmin = await prisma.user.upsert({
    where: { email: "admin@apexconstructions.lk" },
    update: {},
    create: {
      email: "admin@apexconstructions.lk",
      passwordHash,
      fullName: "Eng. Nuwan Jayawardena",
      phone: "+94 77 234 5678",
      systemRole: "COMPANY_ADMIN",
      emailVerified: new Date(),
    },
  });

  const projectManager = await prisma.user.upsert({
    where: { email: "pm@apexconstructions.lk" },
    update: {},
    create: {
      email: "pm@apexconstructions.lk",
      passwordHash,
      fullName: "Eng. Chaminda Rajapaksha",
      phone: "+94 77 345 6789",
      systemRole: "PROJECT_MANAGER",
      emailVerified: new Date(),
    },
  });

  const siteEngineer = await prisma.user.upsert({
    where: { email: "engineer@apexconstructions.lk" },
    update: {},
    create: {
      email: "engineer@apexconstructions.lk",
      passwordHash,
      fullName: "Eng. Tharindu Dissanayake",
      phone: "+94 71 456 7890",
      systemRole: "SITE_ENGINEER",
      emailVerified: new Date(),
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@apexconstructions.lk" },
    update: {},
    create: {
      email: "accountant@apexconstructions.lk",
      passwordHash,
      fullName: "Nadeesha Samaraweera (ACA)",
      phone: "+94 77 567 8901",
      systemRole: "ACCOUNTANT",
      emailVerified: new Date(),
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client@colomboproperties.lk" },
    update: { clientId: client1.id },
    create: {
      email: "client@colomboproperties.lk",
      passwordHash,
      fullName: "Deshamanya Rohan Wijesekara",
      phone: "+94 11 255 8899",
      systemRole: "CLIENT",
      clientId: client1.id,
      emailVerified: new Date(),
    },
  });

  // Memberships
  for (const u of [
    { user: superAdmin, role: "SUPER_ADMIN" as const, title: "Platform Architect" },
    { user: companyAdmin, role: "COMPANY_ADMIN" as const, title: "Managing Director" },
    { user: projectManager, role: "PROJECT_MANAGER" as const, title: "Senior Project Manager" },
    { user: siteEngineer, role: "SITE_ENGINEER" as const, title: "Lead Resident Site Engineer" },
    { user: accountant, role: "ACCOUNTANT" as const, title: "Chief Financial Accountant" },
    { user: clientUser, role: "CLIENT" as const, title: "Client Representative" },
  ]) {
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: u.user.id } },
      update: {},
      create: {
        organizationId: org.id,
        userId: u.user.id,
        branchId: colomboBranch.id,
        systemRole: u.role,
        title: u.title,
      },
    });
  }

  // Projects
  const proj1 = await prisma.project.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "PRJ-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      clientId: client1.id,
      projectManagerId: projectManager.id,
      code: "PRJ-2026-001",
      name: "Colombo Lotus Skyline Residency (28-Storey Tower)",
      description: "Luxury 28-storey residential condominium with 3 basement parking levels, infinity pool, and smart MEP systems in Colombo 03.",
      projectType: "RESIDENTIAL_CONSTRUCTION",
      location: "Marine Drive, Kollupitiya, Colombo 03",
      city: "Colombo",
      startDate: new Date("2026-01-15"),
      expectedCompletionDate: new Date("2027-08-30"),
      contractValue: 485000000,
      estimatedBudget: 392000000,
      revisedBudget: 405000000,
      allocatedIndirectCost: 6500000,
      status: "ONGOING",
      priority: "CRITICAL",
      calculatedProgress: 64.5,
    },
  });

  const proj2 = await prisma.project.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "PRJ-2026-002" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: kandyBranch.id,
      clientId: client2.id,
      projectManagerId: projectManager.id,
      code: "PRJ-2026-002",
      name: "Kandy-Katugastota Flyover & Viaduct Expansion",
      description: "Pre-stressed concrete bridge approach viaduct, retaining walls, and 4-lane asphalt resurfacing.",
      projectType: "INFRASTRUCTURE",
      location: "Katugastota Junction, Kandy",
      city: "Kandy",
      startDate: new Date("2026-03-01"),
      expectedCompletionDate: new Date("2027-03-31"),
      contractValue: 320000000,
      estimatedBudget: 265000000,
      revisedBudget: 270000000,
      allocatedIndirectCost: 4200000,
      status: "ONGOING",
      priority: "HIGH",
      calculatedProgress: 48.0,
    },
  });

  const proj3 = await prisma.project.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "PRJ-2026-003" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      clientId: client3.id,
      projectManagerId: projectManager.id,
      code: "PRJ-2026-003",
      name: "Galle Fort Heritage Boutique Hotel Restoration",
      description: "Structural strengthening, timber roof restoration, courtyard pool, and colonial wing refurbishment.",
      projectType: "RENOVATION",
      location: "Church Street, Galle Fort",
      city: "Galle",
      startDate: new Date("2025-09-01"),
      expectedCompletionDate: new Date("2026-10-15"),
      actualCompletionDate: new Date("2026-10-12"),
      contractValue: 145000000,
      estimatedBudget: 112000000,
      revisedBudget: 115000000,
      allocatedIndirectCost: 2500000,
      status: "COMPLETED",
      priority: "MEDIUM",
      calculatedProgress: 100.0,
    },
  });

  const proj4 = await prisma.project.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "PRJ-2026-004" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      clientId: client1.id,
      projectManagerId: projectManager.id,
      code: "PRJ-2026-004",
      name: "Kelaniya Automated Cold-Storage & Logistics Hub",
      description: "Portal steel frame warehouse, high-load post-tensioned industrial floor slab, and loading docks.",
      projectType: "INDUSTRIAL_CONSTRUCTION",
      location: "Biyagama Export Processing Zone Access Road, Kelaniya",
      city: "Gampaha",
      startDate: new Date("2026-05-10"),
      expectedCompletionDate: new Date("2026-12-20"),
      contractValue: 210000000,
      estimatedBudget: 174000000,
      allocatedIndirectCost: 3100000,
      status: "DELAYED",
      priority: "HIGH",
      calculatedProgress: 38.0,
    },
  });

  // Project Milestones & Tasks for Proj 1
  const existingMilestones = await prisma.projectMilestone.count({ where: { projectId: proj1.id } });
  if (existingMilestones === 0) {
    const ms1 = await prisma.projectMilestone.create({
      data: {
        projectId: proj1.id,
        title: "Phase 1: Piling, Secant Wall & Substructure",
        description: "36 Bored cast-in-situ piles, pile caps, and 3 basement raft slabs.",
        dueDate: new Date("2026-05-15"),
        completedDate: new Date("2026-05-10"),
        weightPct: 30,
        progressPct: 100,
        billingAmount: 145500000,
        isCompleted: true,
      },
    });

    const ms2 = await prisma.projectMilestone.create({
      data: {
        projectId: proj1.id,
        title: "Phase 2: Superstructure RCC Core & Podium Floors (L1–L18)",
        description: "Slip-form lift core, post-tensioned slabs, and shear walls.",
        dueDate: new Date("2026-12-15"),
        weightPct: 40,
        progressPct: 75,
        billingAmount: 194000000,
        isCompleted: false,
      },
    });

    const ms3 = await prisma.projectMilestone.create({
      data: {
        projectId: proj1.id,
        title: "Phase 3: Upper Levels (L19–L28), MEP & Architectural Finishes",
        description: "HVAC, high-speed elevators, curtain wall glazing, and interior joinery.",
        dueDate: new Date("2027-08-30"),
        weightPct: 30,
        progressPct: 15,
        billingAmount: 145500000,
        isCompleted: false,
      },
    });

    await prisma.projectTask.createMany({
      data: [
        {
          projectId: proj1.id,
          milestoneId: ms1.id,
          assigneeId: siteEngineer.id,
          code: "TSK-101",
          title: "Bored Piling & Sonic Integrity Testing (36 Piles)",
          category: "Foundation Work",
          startDate: new Date("2026-01-18"),
          endDate: new Date("2026-03-20"),
          completedAt: new Date("2026-03-19"),
          priority: "CRITICAL",
          status: "COMPLETED",
          progressPct: 100,
          weight: 3,
        },
        {
          projectId: proj1.id,
          milestoneId: ms1.id,
          assigneeId: siteEngineer.id,
          code: "TSK-102",
          title: "Basement Excavation, Dewatering & Raft Concrete Pour",
          category: "Concrete Work",
          startDate: new Date("2026-03-22"),
          endDate: new Date("2026-05-10"),
          completedAt: new Date("2026-05-10"),
          priority: "HIGH",
          status: "COMPLETED",
          progressPct: 100,
          weight: 3,
        },
        {
          projectId: proj1.id,
          milestoneId: ms2.id,
          assigneeId: siteEngineer.id,
          code: "TSK-103",
          title: "RCC Columns & Slab Casting Levels 1 to 14",
          category: "Superstructure",
          startDate: new Date("2026-05-15"),
          endDate: new Date("2026-10-30"),
          completedAt: new Date("2026-10-28"),
          priority: "CRITICAL",
          status: "COMPLETED",
          progressPct: 100,
          weight: 4,
        },
        {
          projectId: proj1.id,
          milestoneId: ms2.id,
          assigneeId: siteEngineer.id,
          code: "TSK-104",
          title: "Slab Formwork, Rebar & Pouring Levels 15 to 18",
          category: "Superstructure",
          startDate: new Date("2026-11-01"),
          endDate: new Date("2026-12-15"),
          priority: "HIGH",
          status: "IN_PROGRESS",
          progressPct: 60,
          weight: 3,
        },
        {
          projectId: proj1.id,
          milestoneId: ms3.id,
          assigneeId: projectManager.id,
          code: "TSK-105",
          title: "MEP First-Fix Conduits & Fire Fighting Risers (L1–L12)",
          category: "Electrical & Plumbing",
          startDate: new Date("2026-10-15"),
          endDate: new Date("2027-02-28"),
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          progressPct: 45,
          weight: 2,
        },
      ],
    });

    await prisma.projectVariation.create({
      data: {
        projectId: proj1.id,
        variationNumber: "VO-2026-01",
        title: "Addition of Rooftop Solar PV Microgrid & EV Charging Bays",
        description: "Client approved 150kW rooftop solar system and 24 basement EV fast chargers.",
        amount: 18500000,
        costImpact: 13000000,
        timeImpactDays: 14,
        status: "APPROVED",
        approvedBy: "Deshamanya Rohan Wijesekara",
        approvedAt: new Date("2026-09-12"),
      },
    });
  }

  // BOQ for Project 1
  const boq1 = await prisma.bOQ.upsert({
    where: { organizationId_boqCode: { organizationId: org.id, boqCode: "BOQ-PRJ001-V2" } },
    update: {},
    create: {
      organizationId: org.id,
      projectId: proj1.id,
      boqCode: "BOQ-PRJ001-V2",
      title: "Master Bill of Quantities - Colombo Lotus Skyline Residency (Rev 2)",
      versionNumber: 2,
      status: "APPROVED",
      totalAmount: 198650000,
      approvedBy: "Eng. Nuwan Jayawardena",
      approvedAt: new Date("2026-02-01"),
    },
  });

  const existingBoqCats = await prisma.bOQCategory.count({ where: { boqId: boq1.id } });
  if (existingBoqCats === 0) {
    const cat1 = await prisma.bOQCategory.create({
      data: {
        boqId: boq1.id,
        code: "A",
        name: "Excavation & Earthwork",
        sortOrder: 1,
        subtotal: 24500000,
      },
    });
    const cat2 = await prisma.bOQCategory.create({
      data: {
        boqId: boq1.id,
        code: "B",
        name: "Foundation & Structural Concrete Work",
        sortOrder: 2,
        subtotal: 128400000,
      },
    });
    const cat3 = await prisma.bOQCategory.create({
      data: {
        boqId: boq1.id,
        code: "C",
        name: "Masonry, Brickwork & Plastering",
        sortOrder: 3,
        subtotal: 45750000,
      },
    });

    await prisma.bOQItem.createMany({
      data: [
        {
          boqId: boq1.id,
          categoryId: cat1.id,
          itemCode: "A.1",
          description: "Bulk basement excavation in dense soil including shoring & disposal",
          unit: "m3",
          quantity: 5000,
          materialRate: 500,
          labourRate: 1400,
          equipmentRate: 2600,
          otherCost: 400,
          totalUnitRate: 4900,
          totalAmount: 24500000,
          actualQuantity: 5120,
          actualAmount: 25088000,
        },
        {
          boqId: boq1.id,
          categoryId: cat2.id,
          itemCode: "B.1",
          description: "Grade 40 Ready-Mix Concrete for Raft Foundation & Core Walls",
          unit: "m3",
          quantity: 3200,
          materialRate: 24500,
          labourRate: 4200,
          equipmentRate: 2800,
          otherCost: 500,
          totalUnitRate: 32000,
          totalAmount: 102400000,
          actualQuantity: 2400,
          actualAmount: 76800000,
        },
        {
          boqId: boq1.id,
          categoryId: cat2.id,
          itemCode: "B.2",
          description: "High-Yield Deformed Tor Steel Reinforcement (Fe500) Cut, Bent & Fixed",
          unit: "MT",
          quantity: 65,
          materialRate: 315000,
          labourRate: 62000,
          equipmentRate: 15000,
          otherCost: 8000,
          totalUnitRate: 400000,
          totalAmount: 26000000,
          actualQuantity: 52,
          actualAmount: 20800000,
        },
        {
          boqId: boq1.id,
          categoryId: cat3.id,
          itemCode: "C.1",
          description: "200mm Cement Block Masonry Wall in 1:5 Cement Sand Mortar",
          unit: "m2",
          quantity: 7500,
          materialRate: 4100,
          labourRate: 1650,
          equipmentRate: 200,
          otherCost: 150,
          totalUnitRate: 6100,
          totalAmount: 45750000,
          actualQuantity: 4200,
          actualAmount: 25620000,
        },
      ],
    });

    await prisma.bOQRevision.create({
      data: {
        boqId: boq1.id,
        versionNumber: 1,
        totalAmount: 189200000,
        changeSummary: "Initial baseline tender BOQ prior to Grade 40 concrete mix revision.",
        snapshotJson: JSON.stringify({ version: 1, items: 4 }),
        revisedBy: "Eng. Chaminda Rajapaksha",
      },
    });
  }

  // Suppliers
  const sup1 = await prisma.supplier.upsert({
    where: { organizationId_supplierCode: { organizationId: org.id, supplierCode: "SUP-001" } },
    update: {},
    create: {
      organizationId: org.id,
      supplierCode: "SUP-001",
      name: "Tokyo Cement Company (Lanka) PLC",
      category: "Cement & Concrete",
      contactPerson: "Suresh Gunawardena",
      phone: "+94 11 255 8100",
      email: "corporate.sales@tokyocement.lk",
      address: "No. 469 1/1, Galle Road, Colombo 03",
      city: "Colombo",
      paymentTermsDays: 30,
      taxRegistrationNo: "114002291-7000",
      outstandingBalance: 4850000,
    },
  });

  const sup2 = await prisma.supplier.upsert({
    where: { organizationId_supplierCode: { organizationId: org.id, supplierCode: "SUP-002" } },
    update: {},
    create: {
      organizationId: org.id,
      supplierCode: "SUP-002",
      name: "Melwa Steel & Wire Industries (Pvt) Ltd",
      category: "Reinforcement Steel",
      contactPerson: "Roshantha De Silva",
      phone: "+94 11 294 7500",
      email: "orders@melwasteel.lk",
      address: "Ekala Industrial Estate, Ja-Ela",
      city: "Gampaha",
      paymentTermsDays: 45,
      taxRegistrationNo: "114889912-7000",
      outstandingBalance: 7200000,
    },
  });

  const sup3 = await prisma.supplier.upsert({
    where: { organizationId_supplierCode: { organizationId: org.id, supplierCode: "SUP-003" } },
    update: {},
    create: {
      organizationId: org.id,
      supplierCode: "SUP-003",
      name: "ACL Cables & Kelani Electrical Supplies",
      category: "Electrical & Plumbing",
      contactPerson: "Pradeep Karunaratne",
      phone: "+94 11 269 7652",
      email: "trade@aclcables.lk",
      address: "No. 60, Rodney Street, Colombo 08",
      city: "Colombo",
      paymentTermsDays: 30,
      outstandingBalance: 1450000,
    },
  });

  // Warehouses
  const wh1 = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "WH-PEL" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      code: "WH-PEL",
      name: "Peliyagoda Central Logistics Yard",
      location: "No. 140, Negombo Road, Peliyagoda",
      keeperName: "Sunil Ratnayake",
    },
  });

  const wh2 = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "WH-SITE01" } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      code: "WH-SITE01",
      name: "Lotus Skyline Site Store (Colombo 03)",
      location: "Marine Drive Site Compound, Colombo 03",
      keeperName: "Ajith Kumara",
    },
  });

  // Materials
  const matCement = await prisma.material.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAT-001" } },
    update: {},
    create: {
      organizationId: org.id,
      preferredSupplierId: sup1.id,
      code: "MAT-001",
      name: "Tokyo Super OPC Cement (50kg Bag)",
      categoryType: "CEMENT",
      unit: "Bags",
      minimumStockLevel: 500,
      currentStock: 1850,
      defaultPurchasePrice: 2350,
      defaultIssueRate: 2400,
    },
  });

  const matSteel = await prisma.material.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAT-002" } },
    update: {},
    create: {
      organizationId: org.id,
      preferredSupplierId: sup2.id,
      code: "MAT-002",
      name: "Melwa QT 16mm Ribbed Tor Steel Bar (Fe500)",
      categoryType: "STEEL",
      unit: "MT",
      minimumStockLevel: 25,
      currentStock: 68.5,
      defaultPurchasePrice: 310000,
      defaultIssueRate: 315000,
    },
  });

  const matSand = await prisma.material.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAT-003" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "MAT-003",
      name: "Manampitiya Washed River Sand",
      categoryType: "SAND",
      unit: "Cubes",
      minimumStockLevel: 40,
      currentStock: 22, // Intentionally below minimumStockLevel to trigger Low Stock Alert!
      defaultPurchasePrice: 24500,
      defaultIssueRate: 25000,
    },
  });

  const matCable = await prisma.material.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAT-004" } },
    update: {},
    create: {
      organizationId: org.id,
      preferredSupplierId: sup3.id,
      code: "MAT-004",
      name: "ACL 2.5mm Fire-Retardant Copper PVC Cable (100m Coil)",
      categoryType: "ELECTRICAL",
      unit: "Coils",
      minimumStockLevel: 100,
      currentStock: 64, // Also Low Stock Alert!
      defaultPurchasePrice: 14800,
      defaultIssueRate: 15200,
    },
  });

  // Stock Issues & Movements
  const existingIssues = await prisma.stockIssue.count({ where: { organizationId: org.id } });
  if (existingIssues === 0) {
    const issue1 = await prisma.stockIssue.create({
      data: {
        organizationId: org.id,
        projectId: proj1.id,
        warehouseId: wh2.id,
        issueNumber: "ISS-2026-001",
        issueDate: new Date("2026-10-10"),
        issuedTo: "Eng. Tharindu Dissanayake",
        status: "APPROVED",
        totalValue: 41850000,
        approvedBy: "Eng. Chaminda Rajapaksha",
        notes: "Cement & Tor Steel issue for L12–L15 structural core and slabs.",
      },
    });

    await prisma.stockIssueItem.createMany({
      data: [
        {
          stockIssueId: issue1.id,
          materialId: matCement.id,
          quantity: 4500,
          unitCost: 2350,
          totalCost: 10575000,
        },
        {
          stockIssueId: issue1.id,
          materialId: matSteel.id,
          quantity: 100.887,
          unitCost: 310000,
          totalCost: 31275000,
        },
      ],
    });

    await prisma.stockMovement.createMany({
      data: [
        {
          organizationId: org.id,
          materialId: matCement.id,
          warehouseId: wh1.id,
          movementCode: "MOV-2026-001",
          movementType: "GRN_RECEIVE",
          quantity: 6350,
          unitCost: 2350,
          totalCost: 14922500,
          balanceAfter: 6350,
          referenceNo: "GRN-2026-001",
          performedBy: "Sunil Ratnayake",
          movementDate: new Date("2026-10-01"),
        },
        {
          organizationId: org.id,
          materialId: matCement.id,
          warehouseId: wh2.id,
          projectId: proj1.id,
          movementCode: "MOV-2026-002",
          movementType: "STOCK_ISSUE",
          quantity: -4500,
          unitCost: 2350,
          totalCost: 10575000,
          balanceAfter: 1850,
          referenceNo: "ISS-2026-001",
          performedBy: "Ajith Kumara",
          movementDate: new Date("2026-10-10"),
        },
      ],
    });
  }

  // Labour Workforce
  const lab1 = await prisma.labour.upsert({
    where: { organizationId_labourCode: { organizationId: org.id, labourCode: "LAB-001" } },
    update: {},
    create: {
      organizationId: org.id,
      labourCode: "LAB-001",
      fullName: "K.A. Dharmasena",
      nicNumber: "198214502119",
      phone: "+94 71 811 2233",
      address: "No. 45, Temple Road, Kadawatha",
      emergencyContact: "+94 71 900 1122",
      categoryType: "MASON",
      employmentType: "DAILY_WAGE",
      dailyWage: 4500,
      overtimeHourlyRate: 840,
      joiningDate: new Date("2024-03-10"),
      status: "ACTIVE",
    },
  });

  const lab2 = await prisma.labour.upsert({
    where: { organizationId_labourCode: { organizationId: org.id, labourCode: "LAB-002" } },
    update: {},
    create: {
      organizationId: org.id,
      labourCode: "LAB-002",
      fullName: "W.M. Samantha Bandara",
      nicNumber: "198829901442",
      phone: "+94 77 492 8811",
      address: "No. 18, Kandy Road, Nittambuwa",
      categoryType: "CARPENTER",
      employmentType: "DAILY_WAGE",
      dailyWage: 4400,
      overtimeHourlyRate: 825,
      joiningDate: new Date("2024-06-15"),
      status: "ACTIVE",
    },
  });

  const lab3 = await prisma.labour.upsert({
    where: { organizationId_labourCode: { organizationId: org.id, labourCode: "LAB-003" } },
    update: {},
    create: {
      organizationId: org.id,
      labourCode: "LAB-003",
      fullName: "S. Sivakumar",
      nicNumber: "199011204558",
      phone: "+94 76 311 4590",
      address: "Wattala, Hendala",
      categoryType: "ELECTRICIAN",
      employmentType: "MONTHLY_SALARY",
      dailyWage: 4800,
      monthlySalary: 124800,
      overtimeHourlyRate: 900,
      joiningDate: new Date("2023-11-01"),
      status: "ACTIVE",
    },
  });

  const lab4 = await prisma.labour.upsert({
    where: { organizationId_labourCode: { organizationId: org.id, labourCode: "LAB-004" } },
    update: {},
    create: {
      organizationId: org.id,
      labourCode: "LAB-004",
      fullName: "H.R. Priyantha Silva",
      nicNumber: "197930401189",
      phone: "+94 71 229 8877",
      address: "Moratuwa, Soysapura",
      categoryType: "SITE_SUPERVISOR",
      employmentType: "MONTHLY_SALARY",
      dailyWage: 5500,
      monthlySalary: 143000,
      overtimeHourlyRate: 1030,
      joiningDate: new Date("2022-05-20"),
      status: "ACTIVE",
    },
  });

  // Assign Labours & Attendance
  const existingAtt = await prisma.attendance.count({ where: { organizationId: org.id } });
  if (existingAtt === 0) {
    for (const l of [lab1, lab2, lab3, lab4]) {
      await prisma.labourAssignment.create({
        data: {
          labourId: l.id,
          projectId: proj1.id,
          isCurrent: true,
          notes: "Assigned to Colombo Lotus Skyline Superstructure crew.",
        },
      });
    }

    const dates = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];
    for (const d of dates) {
      for (const l of [lab1, lab2, lab3, lab4]) {
        const dw = Number(l.dailyWage);
        const otRate = Number(l.overtimeHourlyRate);
        const otHrs = 2;
        const otEarned = otHrs * otRate;
        await prisma.attendance.create({
          data: {
            organizationId: org.id,
            labourId: l.id,
            projectId: proj1.id,
            workDate: new Date(d),
            shift: "DAY",
            checkIn: "07:30",
            checkOut: "18:30",
            status: "FULL_DAY",
            overtimeHours: otHrs,
            dailyWageEarned: dw,
            overtimeEarned: otEarned,
            totalEarned: dw + otEarned,
            remarks: "Regular shift + 2h concrete pouring overtime",
          },
        });
      }
    }

    await prisma.labourAdvance.create({
      data: {
        labourId: lab1.id,
        projectId: proj1.id,
        advanceDate: new Date("2026-11-05"),
        amount: 25000,
        recoveredAmt: 10000,
        reason: "Festival & family medical advance",
        status: "APPROVED",
      },
    });
  }

  // Contractors & Agreements
  const con1 = await prisma.contractor.upsert({
    where: { organizationId_contractorCode: { organizationId: org.id, contractorCode: "CON-001" } },
    update: {},
    create: {
      organizationId: org.id,
      contractorCode: "CON-001",
      name: "Maga Foundation & Piling Specialists (Pvt) Ltd",
      companyName: "Maga Foundation & Piling Specialists (Pvt) Ltd",
      category: "Piling & Geotechnical",
      phone: "+94 11 280 8800",
      email: "contracts@magapiling-demo.lk",
      address: "Nawala Road, Narahenpita, Colombo 05",
      nicOrBrn: "PV-0019283",
      bankDetails: "Commercial Bank PLC - Kollupitiya Branch - A/C 1100928374",
      rating: 5,
    },
  });

  const con2 = await prisma.contractor.upsert({
    where: { organizationId_contractorCode: { organizationId: org.id, contractorCode: "CON-002" } },
    update: {},
    create: {
      organizationId: org.id,
      contractorCode: "CON-002",
      name: "Lanka MEP & HVAC Engineering Solutions",
      companyName: "Lanka MEP Solutions (Pvt) Ltd",
      category: "MEP, HVAC & Fire Safety",
      phone: "+94 11 271 9900",
      email: "projects@lankamep.lk",
      address: "Pepiliyana Road, Nedimala, Dehiwala",
      nicOrBrn: "PV-0062910",
      bankDetails: "Sampath Bank PLC - Head Office - A/C 002910092831",
      rating: 5,
    },
  });

  const agr1 = await prisma.contractorAgreement.upsert({
    where: { organizationId_agreementNumber: { organizationId: org.id, agreementNumber: "AGR-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      contractorId: con1.id,
      projectId: proj1.id,
      agreementNumber: "AGR-2026-001",
      title: "Subcontract for Secant Pile Shoring & 36 Bored Foundation Piles",
      scopeOfWork: "Drilling, rebar cage lowering, tremie concreting, and PDA dynamic load testing.",
      paymentBasis: "MEASURED_WORK",
      contractAmount: 95000000,
      advanceAmount: 15000000,
      advanceRecovered: 12000000,
      retentionPct: 5.0,
      retentionHeld: 4250000,
      certifiedWorkValue: 85000000,
      totalPaid: 68750000,
      progressPct: 90.0,
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-06-30"),
      status: "ACTIVE",
    },
  });

  await prisma.contractorPayment.upsert({
    where: { organizationId_voucherNumber: { organizationId: org.id, voucherNumber: "CPV-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      contractorId: con1.id,
      projectId: proj1.id,
      agreementId: agr1.id,
      voucherNumber: "CPV-2026-001",
      paymentDate: new Date("2026-06-15"),
      approvedWorkValue: 85000000,
      previousCertifiedPayments: 45000000,
      currentGrossClaim: 40000000,
      advanceRecovery: 6000000,
      retentionAmount: 2000000,
      otherDeductions: 0,
      netPayable: 32000000,
      paymentMethod: "BANK_TRANSFER",
      status: "APPROVED",
      approvedBy: "Eng. Nuwan Jayawardena",
      notes: "IPC #03 Certified payment for completion of 36 foundation piles.",
    },
  });

  // Procurement: Purchase Request, PO, GRN
  const pr1 = await prisma.purchaseRequest.upsert({
    where: { organizationId_requestNumber: { organizationId: org.id, requestNumber: "PR-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      projectId: proj1.id,
      requestNumber: "PR-2026-001",
      requestedBy: "Eng. Tharindu Dissanayake",
      requiredDate: new Date("2026-11-28"),
      priority: "HIGH",
      status: "PENDING",
      estimatedTotal: 15500000,
      notes: "Urgent 50 MT Tor Steel requisition for Level 19–22 columns & slabs.",
    },
  });

  const po1 = await prisma.purchaseOrder.upsert({
    where: { organizationId_poNumber: { organizationId: org.id, poNumber: "PO-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      supplierId: sup1.id,
      projectId: proj1.id,
      poNumber: "PO-2026-001",
      orderDate: new Date("2026-10-01"),
      expectedDelivery: new Date("2026-10-05"),
      status: "COMPLETED",
      subtotal: 14922500,
      taxAmount: 2686050,
      discountAmount: 0,
      totalAmount: 17608550,
      approvedBy: "Eng. Nuwan Jayawardena",
      approvedAt: new Date("2026-10-01"),
    },
  });

  // Finance: Chart of Accounts
  const accBank = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "1010" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "1010",
      name: "Commercial Bank PLC - Corporate Current A/C",
      accountType: "ASSET",
      subType: "Bank",
      balance: 142500000,
      isBankAccount: true,
      bankName: "Commercial Bank of Ceylon PLC",
      accountNumber: "1000948271",
      isSystem: true,
    },
  });

  const accCash = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "1020" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "1020",
      name: "Head Office & Site Petty Cash Float",
      accountType: "ASSET",
      subType: "Cash",
      balance: 4850000,
      isCashAccount: true,
      isSystem: true,
    },
  });

  const accAR = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "1100" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "1100",
      name: "Accounts Receivable (Client Progress Billings)",
      accountType: "ASSET",
      subType: "Current Asset",
      balance: 78400000,
      isSystem: true,
    },
  });

  const accInventory = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "1200" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "1200",
      name: "Construction Materials Inventory Asset",
      accountType: "ASSET",
      subType: "Inventory",
      balance: 27149300,
      isSystem: true,
    },
  });

  const accAP = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "2010" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "2010",
      name: "Accounts Payable (Trade Suppliers & Subcontractors)",
      accountType: "LIABILITY",
      subType: "Current Liability",
      balance: 13500000,
      isSystem: true,
    },
  });

  const accRevenue = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "4010" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "4010",
      name: "Contract Progress Billing Revenue",
      accountType: "REVENUE",
      subType: "Operating Revenue",
      balance: 615000000,
      isSystem: true,
    },
  });

  const accDirectCost = await prisma.account.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "5010" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "5010",
      name: "Direct Construction Cost of Sales (Materials, Labour & Subcontracts)",
      accountType: "EXPENSE",
      subType: "Cost of Sales",
      balance: 448000000,
      isSystem: true,
    },
  });

  // Balanced Double-Entry Journal Entry
  const je1 = await prisma.journalEntry.upsert({
    where: { organizationId_entryNumber: { organizationId: org.id, entryNumber: "JE-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      entryNumber: "JE-2026-001",
      entryDate: new Date("2026-10-15"),
      referenceNo: "INV-2026-001",
      description: "Recognition of IPC #04 Client Progress Billing on Colombo Lotus Skyline",
      sourceModule: "INVOICING",
      totalDebit: 165200000,
      totalCredit: 165200000,
      postedBy: "Nadeesha Samaraweera (ACA)",
    },
  });

  const existingJeLines = await prisma.journalEntryLine.count({ where: { journalEntryId: je1.id } });
  if (existingJeLines === 0) {
    await prisma.journalEntryLine.createMany({
      data: [
        {
          journalEntryId: je1.id,
          accountId: accBank.id,
          projectId: proj1.id,
          description: "Bank receipt from Colombo Metro Properties PLC",
          debit: 120000000,
          credit: 0,
        },
        {
          journalEntryId: je1.id,
          accountId: accAR.id,
          projectId: proj1.id,
          description: "Balance receivable on IPC #04",
          debit: 45200000,
          credit: 0,
        },
        {
          journalEntryId: je1.id,
          accountId: accRevenue.id,
          projectId: proj1.id,
          description: "Certified construction revenue recognized",
          debit: 0,
          credit: 165200000,
        },
      ],
    });
  }

  // Client Invoices
  const inv1 = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: org.id, invoiceNumber: "INV-2026-001" } },
    update: {},
    create: {
      organizationId: org.id,
      clientId: client1.id,
      projectId: proj1.id,
      invoiceNumber: "INV-2026-001",
      invoiceDate: new Date("2026-10-15"),
      dueDate: new Date("2026-11-30"),
      description: "Interim Payment Certificate #04 - Superstructure Progress up to Level 14",
      subtotal: 140000000,
      discountAmount: 0,
      taxRate: 18.0,
      taxAmount: 25200000,
      totalAmount: 165200000,
      paidAmount: 120000000,
      outstandingAmount: 45200000,
      status: "PARTIALLY_PAID",
    },
  });

  const inv2 = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: org.id, invoiceNumber: "INV-2026-002" } },
    update: {},
    create: {
      organizationId: org.id,
      clientId: client2.id,
      projectId: proj2.id,
      invoiceNumber: "INV-2026-002",
      invoiceDate: new Date("2026-10-20"),
      dueDate: new Date("2026-12-05"),
      description: "IPC #02 - Kandy Flyover Pier Caps & Pre-Stressed Girder Launching",
      subtotal: 95000000,
      discountAmount: 0,
      taxRate: 18.0,
      taxAmount: 17100000,
      totalAmount: 112100000,
      paidAmount: 78900000,
      outstandingAmount: 33200000,
      status: "PARTIALLY_PAID",
    },
  });

  const inv3 = await prisma.invoice.upsert({
    where: { organizationId_invoiceNumber: { organizationId: org.id, invoiceNumber: "INV-2026-003" } },
    update: {},
    create: {
      organizationId: org.id,
      clientId: client3.id,
      projectId: proj3.id,
      invoiceNumber: "INV-2026-003",
      invoiceDate: new Date("2026-10-12"),
      dueDate: new Date("2026-11-12"),
      description: "Final Completion Billing - Galle Fort Heritage Boutique Hotel",
      subtotal: 122881355.93,
      discountAmount: 0,
      taxRate: 18.0,
      taxAmount: 22118644.07,
      totalAmount: 145000000,
      paidAmount: 145000000,
      outstandingAmount: 0,
      status: "PAID",
    },
  });

  // Project Expenses
  const expList = [
    {
      code: "EXP-2026-001",
      projectId: proj1.id,
      category: "EQUIPMENT_RENTAL" as const,
      description: "Potain Tower Crane MC-85B Monthly Hire & Operator Fee",
      amount: 3450000,
      date: "2026-10-25",
      status: "APPROVED" as const,
      isDirectCost: true,
    },
    {
      code: "EXP-2026-002",
      projectId: proj1.id,
      category: "TRANSPORT_EXPENSES" as const,
      description: "Low-bed Trailer Haulage & Ready-Mix Concrete Pump Mobilization",
      amount: 1280000,
      date: "2026-11-02",
      status: "APPROVED" as const,
      isDirectCost: true,
    },
    {
      code: "EXP-2026-003",
      projectId: proj1.id,
      category: "UTILITY_EXPENSES" as const,
      description: "CEB Bulk 3-Phase Site Power & NWSDB Water Charges",
      amount: 890000,
      date: "2026-11-10",
      status: "APPROVED" as const,
      isDirectCost: true,
    },
    {
      code: "EXP-2026-004",
      projectId: proj2.id,
      category: "FUEL_EXPENSES" as const,
      description: "Auto Diesel Bulk Supply (4,500L) for Excavators & Mobile Cranes",
      amount: 1485000,
      date: "2026-11-14",
      status: "PENDING" as const,
      isDirectCost: true,
    },
  ];

  for (const e of expList) {
    await prisma.expense.upsert({
      where: { organizationId_expenseNumber: { organizationId: org.id, expenseNumber: e.code } },
      update: {},
      create: {
        organizationId: org.id,
        projectId: e.projectId,
        expenseNumber: e.code,
        category: e.category,
        description: e.description,
        expenseDate: new Date(e.date),
        amount: e.amount,
        paymentMethod: "BANK_TRANSFER",
        paidBy: "Nadeesha Samaraweera (ACA)",
        status: e.status,
        isDirectCost: e.isDirectCost,
      },
    });
  }

  // Site Management: Daily Site Reports
  const dsr1 = await prisma.dailySiteReport.upsert({
    where: { organizationId_reportNumber: { organizationId: org.id, reportNumber: "DSR-2026-112" } },
    update: {},
    create: {
      organizationId: org.id,
      projectId: proj1.id,
      reportNumber: "DSR-2026-112",
      reportDate: new Date("2026-11-19"),
      weatherCondition: "Sunny & Clear",
      temperatureC: 31,
      labourCount: 84,
      workActivities: "Level 16 Slab rebar fixing, electrical conduit laying, and core wall climb formwork lifting.",
      workCompleted: "Completed 420m2 of Level 16 deck shuttering and 18 MT reinforcement tying.",
      materialsUsedNote: "145 Bags Tokyo Super Cement, 18 MT 16mm Tor Steel",
      equipmentUsedNote: "Tower Crane TC-01 (9.5 hrs), Concrete Hoist CH-02 (8 hrs)",
      siteInstructions: "Ensure cube test samples are cured for 7-day and 28-day crushing strength verification.",
      progressIncrement: 0.45,
      submittedBy: "Eng. Tharindu Dissanayake",
    },
  });

  // Equipment
  const eq1 = await prisma.equipment.upsert({
    where: { organizationId_equipmentCode: { organizationId: org.id, equipmentCode: "EQP-001" } },
    update: {},
    create: {
      organizationId: org.id,
      equipmentCode: "EQP-001",
      name: "Potain MC-85B Top-Slewing Tower Crane",
      category: "Tower Cranes",
      ownership: "RENTAL",
      status: "IN_USE",
      dailyRentalRate: 115000,
      operatingHours: 1420,
      fuelConsumedLiters: 0,
      nextMaintenanceAt: new Date("2026-12-10"),
    },
  });

  const eq2 = await prisma.equipment.upsert({
    where: { organizationId_equipmentCode: { organizationId: org.id, equipmentCode: "EQP-002" } },
    update: {},
    create: {
      organizationId: org.id,
      equipmentCode: "EQP-002",
      name: "CAT 320D Hydraulic Crawler Excavator",
      category: "Earthmoving",
      ownership: "OWNED",
      status: "IN_USE",
      dailyRentalRate: 65000,
      operatingHours: 3180,
      fuelConsumedLiters: 12450,
      nextMaintenanceAt: new Date("2026-11-30"),
    },
  });

  // Approvals Queue
  const existingApprovals = await prisma.approval.count({ where: { organizationId: org.id } });
  if (existingApprovals === 0) {
    await prisma.approval.createMany({
      data: [
        {
          organizationId: org.id,
          requesterId: siteEngineer.id,
          entityType: "PURCHASE_REQUEST",
          entityId: pr1.id,
          referenceCode: "PR-2026-001",
          title: "50 MT Tor Steel Requisition for Level 19–22 Superstructure",
          amount: 15500000,
          projectId: proj1.id,
          approvalLevel: 1,
          status: "PENDING",
          comments: "Required on site before 28/11/2026 to maintain crane cycle schedule.",
        },
        {
          organizationId: org.id,
          requesterId: accountant.id,
          entityType: "PROJECT_EXPENSE",
          entityId: "EXP-2026-004",
          referenceCode: "EXP-2026-004",
          title: "Auto Diesel Bulk Supply (4,500L) for Kandy Viaduct",
          amount: 1485000,
          projectId: proj2.id,
          approvalLevel: 1,
          status: "PENDING",
          comments: "CPC bowser delivery verified by Kandy Store Keeper.",
        },
      ],
    });
  }

  // Notifications
  const existingNotifs = await prisma.notification.count({ where: { organizationId: org.id } });
  if (existingNotifs === 0) {
    await prisma.notification.createMany({
      data: [
        {
          organizationId: org.id,
          title: "Low Stock Alert: Manampitiya Washed River Sand",
          message: "Current stock (22 Cubes) is below minimum threshold (40 Cubes) at Peliyagoda Yard.",
          category: "LOW_STOCK",
          linkUrl: "/inventory/materials",
          isRead: false,
        },
        {
          organizationId: org.id,
          title: "Purchase Request Pending Approval (PR-2026-001)",
          message: "Eng. Tharindu submitted a Purchase Request for LKR 15,500,000.00.",
          category: "APPROVAL",
          linkUrl: "/approvals",
          isRead: false,
        },
        {
          organizationId: org.id,
          title: "Project Schedule Alert: Kelaniya Cold-Storage Hub",
          message: "PRJ-2026-004 is flagged as DELAYED (38% complete). Review task dependencies.",
          category: "PROJECT_DELAY",
          linkUrl: `/projects/${proj4.id}`,
          isRead: false,
        },
        {
          organizationId: org.id,
          title: "Client Payment Received: LKR 120,000,000.00",
          message: "Colombo Metro Properties PLC settled partial payment on INV-2026-001.",
          category: "FINANCE",
          linkUrl: "/finance/invoices",
          isRead: true,
        },
      ],
    });
  }

  // Documents
  const existingDocs = await prisma.document.count({ where: { organizationId: org.id } });
  if (existingDocs === 0) {
    await prisma.document.createMany({
      data: [
        {
          organizationId: org.id,
          projectId: proj1.id,
          title: "FIDIC Red Book Main Construction Contract - Colombo Lotus Skyline",
          category: "CONTRACT",
          fileName: "FIDIC-Contract-PRJ-2026-001.pdf",
          fileUrl: "/api/documents/download?code=FIDIC-PRJ-001",
          fileSizeKb: 4280,
          version: 1,
          uploadedBy: "Eng. Nuwan Jayawardena",
          isClientVisible: true,
        },
        {
          organizationId: org.id,
          projectId: proj1.id,
          title: "Structural Raft & Core Wall Reinforcement Drawings (Rev C)",
          category: "STRUCTURAL_DRAWING",
          fileName: "STR-CORE-L1-L28-RevC.pdf",
          fileUrl: "/api/documents/download?code=STR-CORE-REVC",
          fileSizeKb: 12840,
          version: 3,
          uploadedBy: "Eng. Chaminda Rajapaksha",
          isClientVisible: true,
        },
        {
          organizationId: org.id,
          projectId: proj3.id,
          title: "Practical Completion Certificate - Galle Fort Heritage Boutique Hotel",
          category: "COMPLETION_CERTIFICATE",
          fileName: "Completion-Cert-PRJ-2026-003.pdf",
          fileUrl: "/api/documents/download?code=COMP-PRJ-003",
          fileSizeKb: 1520,
          version: 1,
          uploadedBy: "Eng. Nuwan Jayawardena",
          isClientVisible: true,
        },
      ],
    });
  }

  console.log("BuildMaster ERP seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

