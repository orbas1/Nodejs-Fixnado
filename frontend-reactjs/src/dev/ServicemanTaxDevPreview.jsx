import ServicemanTaxWorkspace from '../modules/servicemanControlCentre/tax/ServicemanTaxWorkspace.jsx';

const mockSnapshot = {
  context: {
    servicemanId: 'demo-serviceman',
    serviceman: {
      id: 'demo-serviceman',
      name: 'Jordan Matthews'
    }
  },
  profile: {
    filingStatus: 'limited_company',
    residencyCountry: 'GB',
    residencyRegion: 'England',
    vatRegistered: true,
    vatNumber: 'GB123456789',
    utrNumber: '1234567890',
    companyNumber: '09876543',
    taxAdvisorName: 'Apex Tax Advisory',
    taxAdvisorEmail: 'advisor@apextax.co.uk',
    taxAdvisorPhone: '+44 20 1234 5678',
    remittanceCycle: 'quarterly',
    withholdingRate: 20,
    lastFilingSubmittedAt: new Date().toISOString(),
    nextDeadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    notes: 'Registered for Making Tax Digital. Reviews scheduled every quarter.'
  },
  summary: {
    filings: {
      total: 6,
      overdue: 1,
      amountDueTotal: 12840,
      amountPaidTotal: 9650,
      byStatus: {
        draft: 1,
        pending: 1,
        submitted: 2,
        accepted: 1,
        overdue: 1
      }
    },
    tasks: {
      total: 5,
      open: 3,
      overdue: 1,
      byStatus: {
        planned: 2,
        in_progress: 1,
        blocked: 1,
        completed: 1
      }
    },
    documents: {
      total: 9,
      byType: {
        receipt: 3,
        correspondence: 2,
        evidence: 4
      }
    }
  },
  filings: {
    items: [
      {
        id: 'filing-1',
        taxYear: '2024/25',
        period: 'Q1',
        filingType: 'vat_return',
        submissionMethod: 'online',
        status: 'pending',
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        submittedAt: null,
        amountDue: 3100.5,
        amountPaid: 0,
        currency: 'GBP',
        reference: 'VAT-2024-Q1',
        notes: 'Awaiting reconciliation of construction invoices.',
        documents: [],
        updatedAt: new Date().toISOString()
      },
      {
        id: 'filing-2',
        taxYear: '2023/24',
        period: 'Q4',
        filingType: 'vat_return',
        submissionMethod: 'online',
        status: 'accepted',
        dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        amountDue: 2680,
        amountPaid: 2680,
        currency: 'GBP',
        reference: 'VAT-2023-Q4',
        documents: [],
        updatedAt: new Date().toISOString()
      }
    ],
    meta: {
      total: 6,
      overdue: 1
    }
  },
  tasks: {
    items: [
      {
        id: 'task-1',
        title: 'Reconcile mileage expenses',
        status: 'planned',
        priority: 'normal',
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        assignedTo: 'finance-analyst',
        filingId: 'filing-1',
        checklist: [
          { id: 'task-1-step-1', label: 'Collect fuel receipts', completed: false },
          { id: 'task-1-step-2', label: 'Verify mileage log from telematics', completed: false }
        ],
        instructions: 'Ensure all receipts match GPS records before submission.'
      },
      {
        id: 'task-2',
        title: 'Upload CIS statements',
        status: 'blocked',
        priority: 'high',
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        assignedTo: 'compliance-lead',
        filingId: null,
        checklist: [],
        instructions: 'Awaiting subcontractor documentation.'
      }
    ],
    meta: {
      total: 5,
      open: 3,
      overdue: 1
    }
  },
  documents: {
    items: [
      {
        id: 'doc-1',
        title: 'VAT payment receipt - Dec 2024',
        documentType: 'receipt',
        status: 'active',
        fileUrl: 'https://example.com/documents/vat-receipt-dec-2024.pdf',
        thumbnailUrl: '',
        filingId: 'filing-2',
        notes: 'Paid via direct debit',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'doc-2',
        title: 'HMRC correspondence - CIS review',
        documentType: 'correspondence',
        status: 'active',
        fileUrl: 'https://example.com/documents/hmrc-cis-letter.pdf',
        thumbnailUrl: '',
        filingId: null,
        notes: 'Request for clarification on subcontractor payments',
        updatedAt: new Date().toISOString()
      }
    ],
    meta: {
      total: 9
    }
  },
  metadata: {
    filingStatuses: ['draft', 'pending', 'submitted', 'accepted', 'overdue', 'rejected', 'cancelled'],
    filingTypes: ['self_assessment', 'vat_return', 'cis', 'payroll', 'other'],
    submissionMethods: ['online', 'paper', 'agent', 'api', 'other'],
    remittanceCycles: ['monthly', 'quarterly', 'annually', 'ad_hoc'],
    profileFilingStatuses: ['sole_trader', 'limited_company', 'partnership', 'umbrella', 'other'],
    taskStatuses: ['planned', 'in_progress', 'blocked', 'completed'],
    taskPriorities: ['low', 'normal', 'high', 'urgent'],
    documentStatuses: ['active', 'archived', 'superseded'],
    documentTypes: ['evidence', 'receipt', 'correspondence', 'certificate', 'other']
  },
  permissions: {
    canManageProfile: true,
    canManageFilings: true,
    canManageTasks: true,
    canManageDocuments: true
  }
};

export default function ServicemanTaxDevPreview() {
  return <ServicemanTaxWorkspace initialSnapshot={mockSnapshot} servicemanId="demo-serviceman" />;
}
