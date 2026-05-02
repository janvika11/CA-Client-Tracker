import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getFY } from './utils/fyUtils.js';
import User from './models/User.js';
import Service from './models/Service.js';
import Client from './models/Client.js';
import ClientService from './models/ClientService.js';
import BillingEntry from './models/BillingEntry.js';
import Payment from './models/Payment.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ca-tracker';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      Client.deleteMany({}),
      ClientService.deleteMany({}),
      BillingEntry.deleteMany({}),
      Payment.deleteMany({})
    ]);

    // Create demo CA user
    console.log('Creating demo CA user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo1234', salt);

    const demoUser = await User.create({
      name: 'Demo CA',
      email: 'demo@ca.com',
      passwordHash: hashedPassword,
      role: 'owner',
      firmDetails: {
        firmName: 'Demo CA Practice',
        address: '123 Business Street, Mumbai',
        logo: 'https://via.placeholder.com/150'
      }
    });
    await User.updateOne({ _id: demoUser._id }, { $set: { firmId: demoUser._id } });
    console.log('✓ Demo user created:', demoUser.email);

    // Create 8 services
    console.log('Creating services...');
    const servicesData = [
      {
        name: 'GST Monthly Filing',
        code: 'GST-MF',
        category: 'GST',
        defaultPrice: 2500,
        billingCycle: 'monthly',
        description: 'Monthly GST return filing and compliance'
      },
      {
        name: 'GST Annual Return',
        code: 'GST-AR',
        category: 'GST',
        defaultPrice: 15000,
        billingCycle: 'annual',
        description: 'Annual GST reconciliation and return filing'
      },
      {
        name: 'TDS Quarterly Filing',
        code: 'TDS-Q',
        category: 'TDS',
        defaultPrice: 3500,
        billingCycle: 'quarterly',
        description: 'Quarterly TDS certificate and return filing'
      },
      {
        name: 'ITR Filing',
        code: 'ITR-F',
        category: 'Income Tax',
        defaultPrice: 8000,
        billingCycle: 'annual',
        description: 'Individual/Corporate Income Tax Return filing'
      },
      {
        name: 'ROC Compliance',
        code: 'ROC-C',
        category: 'ROC',
        defaultPrice: 5000,
        billingCycle: 'annual',
        description: 'Annual ROC filing and company compliance'
      },
      {
        name: 'Statutory Audit',
        code: 'AUDIT',
        category: 'Audit',
        defaultPrice: 25000,
        billingCycle: 'annual',
        description: 'Statutory audit of financial statements'
      },
      {
        name: 'Advisory Retainer',
        code: 'ADV-RET',
        category: 'Advisory',
        defaultPrice: 12000,
        billingCycle: 'monthly',
        description: 'Monthly advisory and consultation services'
      },
      {
        name: 'Bookkeeping Services',
        code: 'BOOK',
        category: 'Other',
        defaultPrice: 5000,
        billingCycle: 'monthly',
        description: 'Monthly bookkeeping and reconciliation'
      }
    ];

    const services = await Service.create(
      servicesData.map(s => ({ ...s, firmId: demoUser._id }))
    );
    console.log(`✓ Created ${services.length} services`);

    // Create 15 clients with varied data
    console.log('Creating clients...');
    const clientsData = [
      {
        name: 'Acme Manufacturing Ltd',
        firmName: 'Acme Manufacturing Ltd',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@acme.com',
        phone: '+91-9876543210',
        whatsapp: '+919876543210',
        gstin: '27AABCT1234H1Z0',
        pan: 'ACMEA1010A',
        address: '456 Industrial Area, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        status: 'active',
        tags: ['manufacturing', 'large']
      },
      {
        name: 'TechStart Pvt Ltd',
        firmName: 'TechStart Pvt Ltd',
        contactPerson: 'Priya Singh',
        email: 'priya@techstart.com',
        phone: '+91-9876543211',
        whatsapp: '+919876543211',
        gstin: '27AABCS1234H1Z0',
        pan: 'TECHT2020B',
        address: '789 Tech Park, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        status: 'active',
        tags: ['IT', 'startup', 'high-growth']
      },
      {
        name: 'Retail Hub',
        firmName: 'Retail Hub Pvt Ltd',
        contactPerson: 'Amit Patel',
        email: 'amit@retailhub.com',
        phone: '+91-9876543212',
        whatsapp: '+919876543212',
        gstin: '27AABCR1234H1Z0',
        pan: 'RETLR3030C',
        address: '321 Shopping Mall, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        status: 'active',
        tags: ['retail', 'medium']
      },
      {
        name: 'Green Energy Solutions',
        firmName: 'Green Energy Solutions',
        contactPerson: 'Neha Malhotra',
        email: 'neha@greenenergy.com',
        phone: '+91-9876543213',
        whatsapp: '+919876543213',
        gstin: '27AABCG1234H1Z0',
        pan: 'GREEN4040D',
        address: '567 Eco Park, Ahmedabad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        status: 'active',
        tags: ['renewable', 'enterprise']
      },
      {
        name: 'Fashion Forward',
        firmName: 'Fashion Forward Boutique',
        contactPerson: 'Sanjana Gupta',
        email: 'sanjana@fashionforward.com',
        phone: '+91-9876543214',
        whatsapp: '+919876543214',
        gstin: '27AABCF1234H1Z0',
        pan: 'FASHN5050E',
        address: '234 Fashion District, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        status: 'active',
        tags: ['fashion', 'small']
      },
      {
        name: 'Apex Healthcare',
        firmName: 'Apex Healthcare Ltd',
        contactPerson: 'Dr. Vikram Singh',
        email: 'vikram@apexhealth.com',
        phone: '+91-9876543215',
        whatsapp: '+919876543215',
        gstin: '27AABCH1234H1Z0',
        pan: 'APEXH6060F',
        address: '890 Medical Complex, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        status: 'active',
        tags: ['healthcare', 'regulated']
      },
      {
        name: 'Export Trading Co',
        firmName: 'Export Trading Company',
        contactPerson: 'Rohan Desai',
        email: 'rohan@exporttrading.com',
        phone: '+91-9876543216',
        whatsapp: '+919876543216',
        gstin: '27AABCE1234H1Z0',
        pan: 'EXPOR7070G',
        address: '111 Port Area, Kandla',
        city: 'Kandla',
        state: 'Gujarat',
        pincode: '370001',
        status: 'active',
        tags: ['export', 'large']
      },
      {
        name: 'Digital Agency',
        firmName: 'Digital Agency Pvt Ltd',
        contactPerson: 'Anjali Prabhu',
        email: 'anjali@digitalagency.com',
        phone: '+91-9876543217',
        whatsapp: '+919876543217',
        gstin: '27AABCD1234H1Z0',
        pan: 'DIGIT8080H',
        address: '555 IT Hub, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411006',
        status: 'onboarding',
        tags: ['digital', 'startup']
      },
      {
        name: 'Construction Pro',
        firmName: 'Construction Pro Ltd',
        contactPerson: 'Suresh Reddy',
        email: 'suresh@constructionpro.com',
        phone: '+91-9876543218',
        whatsapp: '+919876543218',
        gstin: '',
        pan: 'CONST9090J',
        address: '777 Build Street, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        status: 'active',
        tags: ['construction', 'large']
      },
      {
        name: 'Legal Associates',
        firmName: 'Legal Associates Firm',
        contactPerson: 'Meera Iyer',
        email: 'meera@legalassoc.com',
        phone: '+91-9876543219',
        whatsapp: '+919876543219',
        gstin: '27AABCL1234H1Z0',
        pan: 'LEGAL0101K',
        address: '999 Law Tower, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        status: 'active',
        tags: ['legal', 'professional']
      },
      {
        name: 'Education Institute',
        firmName: 'Education Institute Trust',
        contactPerson: 'Prof. Ramesh Sharma',
        email: 'ramesh@eduinst.com',
        phone: '+91-9876543220',
        whatsapp: '+919876543220',
        gstin: '27AABCI1234H1Z0',
        pan: 'EDUIN1212L',
        address: '222 Academy Road, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110016',
        status: 'active',
        tags: ['education', 'non-profit']
      },
      {
        name: 'Pharma Plus',
        firmName: 'Pharma Plus Ltd',
        contactPerson: 'Dr. Shreya Bhatt',
        email: 'shreya@pharmaplus.com',
        phone: '+91-9876543221',
        whatsapp: '+919876543221',
        gstin: '27AABCP1234H1Z0',
        pan: 'PHARM1313M',
        address: '333 Pharma Zone, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411016',
        status: 'active',
        tags: ['pharmaceutical', 'regulated']
      },
      {
        name: 'Logistics Network',
        firmName: 'Logistics Network Pvt Ltd',
        contactPerson: 'Vikram Singh',
        email: 'vikram@lognet.com',
        phone: '+91-9876543222',
        whatsapp: '+919876543222',
        gstin: '27AABCN1234H1Z0',
        pan: 'LOGIS1414N',
        address: '444 Shipping Lane, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        status: 'inactive',
        tags: ['logistics', 'large']
      },
      {
        name: 'Cafe Delights',
        firmName: 'Cafe Delights Pvt Ltd',
        contactPerson: 'Arjun Reddy',
        email: 'arjun@cafedelights.com',
        phone: '+91-9876543223',
        whatsapp: '+919876543223',
        gstin: '27AABCF1234H1Z0',
        pan: 'CAFED1515P',
        address: '555 Food Street, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        status: 'active',
        tags: ['hospitality', 'small']
      },
      {
        name: 'Auto Components',
        firmName: 'Auto Components Ltd',
        contactPerson: 'Harish Nair',
        email: 'harish@autocomp.com',
        phone: '+91-9876543224',
        whatsapp: '+919876543224',
        gstin: '27AABCA1234H1Z0',
        pan: 'AUTOC1616Q',
        address: '666 Automotive Hub, Surat',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395001',
        status: 'active',
        tags: ['manufacturing', 'medium']
      }
    ];

    const clients = await Client.create(
      clientsData.map(c => ({ ...c, firmId: demoUser._id }))
    );
    console.log(`✓ Created ${clients.length} clients`);

    // Create ClientService relationships and billing data
    console.log('Creating client services and billing data...');

    const serviceMap = {
      'GST-MF': services.find(s => s.code === 'GST-MF'),
      'GST-AR': services.find(s => s.code === 'GST-AR'),
      'TDS-Q': services.find(s => s.code === 'TDS-Q'),
      'ITR-F': services.find(s => s.code === 'ITR-F'),
      'ROC-C': services.find(s => s.code === 'ROC-C'),
      'AUDIT': services.find(s => s.code === 'AUDIT'),
      'ADV-RET': services.find(s => s.code === 'ADV-RET'),
      'BOOK': services.find(s => s.code === 'BOOK')
    };

    // Service assignment per client (varied mixes)
    const clientServiceAssignments = [
      { client: 0, services: ['GST-MF', 'TDS-Q', 'ITR-F', 'ROC-C', 'ADV-RET'] }, // Acme - large
      { client: 1, services: ['GST-MF', 'ITR-F', 'ADV-RET', 'BOOK'] }, // TechStart - startup
      { client: 2, services: ['GST-MF', 'ITR-F', 'BOOK'] }, // Retail Hub
      { client: 3, services: ['GST-AR', 'TDS-Q', 'ITR-F', 'AUDIT', 'ROC-C'] }, // Green Energy
      { client: 4, services: ['GST-MF', 'ITR-F', 'BOOK'] }, // Fashion Forward
      { client: 5, services: ['GST-AR', 'TDS-Q', 'ITR-F', 'AUDIT', 'ADV-RET'] }, // Apex Healthcare
      { client: 6, services: ['GST-MF', 'TDS-Q', 'ITR-F', 'ROC-C'] }, // Export Trading
      { client: 7, services: ['GST-MF', 'ITR-F', 'BOOK'] }, // Digital Agency
      { client: 8, services: ['GST-AR', 'TDS-Q', 'ITR-F', 'AUDIT'] }, // Construction Pro
      { client: 9, services: ['GST-AR', 'ITR-F', 'ADV-RET'] }, // Legal Associates
      { client: 10, services: ['GST-AR', 'ITR-F'] }, // Education Institute
      { client: 11, services: ['GST-AR', 'TDS-Q', 'ITR-F', 'AUDIT', 'ROC-C', 'ADV-RET'] }, // Pharma Plus
      { client: 12, services: ['GST-MF', 'TDS-Q', 'ITR-F', 'ADV-RET'] }, // Logistics Network
      { client: 13, services: ['GST-MF', 'ITR-F', 'BOOK'] }, // Cafe Delights
      { client: 14, services: ['GST-MF', 'TDS-Q', 'ITR-F', 'ROC-C', 'BOOK'] } // Auto Components
    ];

    const clientServices = [];
    const billingEntries = [];
    const payments = [];

    for (const assignment of clientServiceAssignments) {
      const client = clients[assignment.client];
      for (const serviceCode of assignment.services) {
        const service = serviceMap[serviceCode];
        const customPrice = Math.round(
          service.defaultPrice * (0.9 + Math.random() * 0.2)
        ); // 10% variance

        const cs = await ClientService.create({
          clientId: client._id,
          serviceId: service._id,
          customPrice,
          billingCycle: service.billingCycle,
          startDate: new Date(2024, 0, 15),
          isActive: true,
          firmId: demoUser._id
        });
        clientServices.push(cs);

        // Create 6 months of billing entries
        const currentDate = new Date();
        for (let i = 6; i >= 0; i--) {
          const billingDate = new Date(currentDate);
          billingDate.setMonth(billingDate.getMonth() - i);
          const month = billingDate.getMonth() + 1;
          const year = billingDate.getFullYear();
          const financialYear = getFY(new Date(year, month - 1, 1));

          // Determine period based on service billing cycle
          let period = { month, year, label: `${financialYear} - Month ${month}` };
          if (service.billingCycle === 'quarterly') {
            const quarter = Math.ceil(month / 3);
            period = { quarter, year, label: `${financialYear} - Q${quarter}` };
          }

          // Varied statuses
          let status = 'pending';
          let amountPaid = 0;
          let paidOn = null;
          let paymentMode = null;

          const random = Math.random();
          if (random < 0.5) {
            status = 'paid';
            amountPaid = customPrice;
            paidOn = new Date(billingDate);
            paidOn.setDate(paidOn.getDate() + 10);
            paymentMode = ['cash', 'upi', 'bank_transfer', 'cheque'][
              Math.floor(Math.random() * 4)
            ];
          } else if (random < 0.7) {
            status = 'partially_paid';
            amountPaid = Math.round(customPrice * 0.5);
            paidOn = new Date(billingDate);
            paidOn.setDate(paidOn.getDate() + 15);
            paymentMode = ['upi', 'bank_transfer'][Math.floor(Math.random() * 2)];
          } else if (random < 0.85) {
            status = 'pending';
          } else {
            status = 'overdue';
          }

          const billing = await BillingEntry.create({
            clientId: client._id,
            clientServiceId: cs._id,
            serviceId: service._id,
            financialYear,
            period,
            amount: customPrice,
            status,
            amountPaid,
            balance: customPrice - amountPaid,
            dueDate: new Date(billingDate.setDate(billingDate.getDate() + 15)),
            paidOn,
            paymentMode,
            paymentReference: paymentMode
              ? `REF-${client._id.toString().slice(-4)}-${month}-${year}`
              : null,
            notes: 'Auto-generated seed data',
            firmId: demoUser._id
          });
          billingEntries.push(billing);

          // Create payment if paid
          if (amountPaid > 0) {
            const payment = await Payment.create({
              clientId: client._id,
              invoiceIds: [billing._id],
              amount: amountPaid,
              mode: paymentMode,
              reference: `REF-${client._id.toString().slice(-4)}-${month}-${year}`,
              receivedOn: paidOn,
              notes: 'Seed data payment',
              firmId: demoUser._id
            });
            payments.push(payment);
          }
        }
      }
    }

    console.log(`✓ Created ${clientServices.length} client service relationships`);
    console.log(`✓ Created ${billingEntries.length} billing entries`);
    console.log(`✓ Created ${payments.length} payment records`);

    console.log('\n📊 Seeding Summary:');
    console.log(`   - 1 Demo User (demo@ca.com / demo1234)`);
    console.log(`   - ${services.length} Services`);
    console.log(`   - ${clients.length} Clients`);
    console.log(`   - ${clientServices.length} Client-Service relationships`);
    console.log(`   - ${billingEntries.length} Billing Entries (6 months)`);
    console.log(`   - ${payments.length} Payment Records`);
    console.log('\n✅ Database seeding completed successfully!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
