import { UserRole, TenderStatus, BidStatus, ContractStatus } from '@prisma/client';
import { prisma } from './client';

// ============================================
// USER QUERIES
// ============================================

/**
 * Get all users by role
 */
export async function getUsersByRole(role: UserRole) {
  return await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      walletAddress: true,
      // Admin fields
      orgName: true,
      designation: true,
      // Contractor fields
      firmName: true,
      gstNumber: true,
      bankAccountName: true,
      createdAt: true,
    },
  });
}

/**
 * Get all contractors with their bank details
 */
export async function getContractorsWithBankDetails() {
  return await prisma.user.findMany({
    where: { role: UserRole.CONTRACTOR },
    select: {
      id: true,
      name: true,
      email: true,
      firmName: true,
      gstNumber: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankIfscCode: true,
      bankName: true,
      bankBranch: true,
    },
  });
}

/**
 * Get all admins with their organization details
 */
export async function getAdminsWithOrgDetails() {
  return await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: {
      id: true,
      name: true,
      email: true,
      orgName: true,
      designation: true,
      createdAt: true,
    },
  });
}

// ============================================
// TENDER QUERIES
// ============================================

/**
 * Get all unallotted tenders (still available for bidding)
 */
export async function getUnallottedTenders() {
  return await prisma.tender.findMany({
    where: {
      isAllotted: false,
      status: { in: [TenderStatus.OPEN, TenderStatus.CLOSED] },
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          orgName: true,
        },
      },
      bids: {
        include: {
          contractor: {
            select: {
              id: true,
              name: true,
              firmName: true,
            },
          },
        },
      },
      _count: {
        select: {
          bids: true,
        },
      },
    },
    orderBy: {
      bidEndDate: 'asc',
    },
  });
}

/**
 * Get all tenders created by an admin
 */
export async function getTendersByAdmin(adminId: string) {
  return await prisma.tender.findMany({
    where: {
      createdBy: adminId,
    },
    include: {
      bids: {
        include: {
          contractor: {
            select: {
              name: true,
              firmName: true,
            },
          },
        },
      },
      contracts: {
        include: {
          contractor: {
            select: {
              name: true,
              firmName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get tenders with active bidding (bid period is currently open)
 */
export async function getActiveBiddingTenders() {
  const now = new Date();
  return await prisma.tender.findMany({
    where: {
      status: TenderStatus.OPEN,
      bidStartDate: { lte: now },
      bidEndDate: { gte: now },
      isAllotted: false,
    },
    include: {
      creator: {
        select: {
          name: true,
          orgName: true,
        },
      },
      _count: {
        select: {
          bids: true,
        },
      },
    },
    orderBy: {
      bidEndDate: 'asc',
    },
  });
}

/**
 * Get all allotted tenders with contract details
 */
export async function getAllottedTenders() {
  return await prisma.tender.findMany({
    where: {
      isAllotted: true,
    },
    include: {
      creator: {
        select: {
          name: true,
          orgName: true,
        },
      },
      allottedToUser: {
        select: {
          id: true,
          name: true,
          firmName: true,
        },
      },
      contracts: {
        include: {
          contractor: {
            select: {
              name: true,
              firmName: true,
            },
          },
        },
      },
    },
    orderBy: {
      allottedAt: 'desc',
    },
  });
}

/**
 * Get tenders created between two dates
 */
export async function getTendersByDateRange(startDate: Date, endDate: Date) {
  return await prisma.tender.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      creator: {
        select: {
          name: true,
          orgName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get tenders ending soon (within next N days)
 */
export async function getTendersEndingSoon(days: number = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  return await prisma.tender.findMany({
    where: {
      status: TenderStatus.OPEN,
      bidEndDate: {
        gte: now,
        lte: futureDate,
      },
      isAllotted: false,
    },
    include: {
      creator: {
        select: {
          name: true,
          orgName: true,
        },
      },
      _count: {
        select: {
          bids: true,
        },
      },
    },
    orderBy: {
      bidEndDate: 'asc',
    },
  });
}

// ============================================
// BID QUERIES
// ============================================

/**
 * Get all bids for a specific tender
 */
export async function getBidsForTender(tenderId: string) {
  return await prisma.bid.findMany({
    where: {
      tenderId,
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          firmName: true,
          gstNumber: true,
        },
      },
      tender: {
        select: {
          title: true,
          estimatedBudget: true,
        },
      },
    },
    orderBy: {
      bidAmount: 'asc', // Lowest bid first
    },
  });
}

/**
 * Get all bids submitted by a contractor
 */
export async function getBidsByContractor(contractorId: string) {
  return await prisma.bid.findMany({
    where: {
      contractorId,
    },
    include: {
      tender: {
        include: {
          creator: {
            select: {
              name: true,
              orgName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get accepted bids (awarded contracts)
 */
export async function getAcceptedBids() {
  return await prisma.bid.findMany({
    where: {
      status: BidStatus.ACCEPTED,
    },
    include: {
      tender: true,
      contractor: {
        select: {
          name: true,
          firmName: true,
        },
      },
      contract: true,
    },
  });
}

// ============================================
// CONTRACT QUERIES
// ============================================

/**
 * Get all active contracts
 */
export async function getActiveContracts() {
  const now = new Date();
  return await prisma.contract.findMany({
    where: {
      status: ContractStatus.ACTIVE,
      endDate: { gte: now },
    },
    include: {
      tender: {
        select: {
          title: true,
          category: true,
        },
      },
      contractor: {
        select: {
          name: true,
          firmName: true,
          gstNumber: true,
        },
      },
      awardedByUser: {
        select: {
          name: true,
          orgName: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });
}

/**
 * Get contracts by contractor
 */
export async function getContractsByContractor(contractorId: string) {
  return await prisma.contract.findMany({
    where: {
      contractorId,
    },
    include: {
      tender: {
        include: {
          creator: {
            select: {
              name: true,
              orgName: true,
            },
          },
        },
      },
      awardedByUser: {
        select: {
          name: true,
          orgName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ============================================
// ANALYTICS QUERIES
// ============================================

/**
 * Get statistics for an admin
 */
export async function getAdminStatistics(adminId: string) {
  const [
    totalTenders,
    openTenders,
    allottedTenders,
    totalBids,
    totalContracts,
  ] = await Promise.all([
    prisma.tender.count({
      where: { createdBy: adminId },
    }),
    prisma.tender.count({
      where: {
        createdBy: adminId,
        status: TenderStatus.OPEN,
        isAllotted: false,
      },
    }),
    prisma.tender.count({
      where: {
        createdBy: adminId,
        isAllotted: true,
      },
    }),
    prisma.bid.count({
      where: {
        tender: {
          createdBy: adminId,
        },
      },
    }),
    prisma.contract.count({
      where: {
        tender: {
          createdBy: adminId,
        },
      },
    }),
  ]);

  return {
    totalTenders,
    openTenders,
    allottedTenders,
    unallottedTenders: totalTenders - allottedTenders,
    totalBids,
    totalContracts,
  };
}

/**
 * Get statistics for a contractor
 */
export async function getContractorStatistics(contractorId: string) {
  const [
    totalBids,
    acceptedBids,
    activeContracts,
    totalContracts,
  ] = await Promise.all([
    prisma.bid.count({
      where: { contractorId },
    }),
    prisma.bid.count({
      where: {
        contractorId,
        status: BidStatus.ACCEPTED,
      },
    }),
    prisma.contract.count({
      where: {
        contractorId,
        status: ContractStatus.ACTIVE,
      },
    }),
    prisma.contract.count({
      where: { contractorId },
    }),
  ]);

  return {
    totalBids,
    acceptedBids,
    rejectedBids: totalBids - acceptedBids,
    activeContracts,
    totalContracts,
  };
}

