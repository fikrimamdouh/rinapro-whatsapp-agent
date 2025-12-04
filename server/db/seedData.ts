/**
 * Seed Data for Testing
 * Adds sample data to new tables
 */

import { db } from "./sqlite";

export function seedNewTables() {
  const database = db();

  console.log("[Seed] Adding sample data to new tables...");

  try {
    // Seed Drivers
    const drivers = [
      { name: "أحمد محمد", phone: "0501234567", licenseNumber: "LIC001", status: "active", rating: 5, totalDeliveries: 150 },
      { name: "خالد علي", phone: "0509876543", licenseNumber: "LIC002", status: "active", rating: 4, totalDeliveries: 120 },
      { name: "محمود حسن", phone: "0505555555", licenseNumber: "LIC003", status: "active", rating: 5, totalDeliveries: 200 },
    ];

    const driverStmt = database.prepare(`
      INSERT OR IGNORE INTO drivers (name, phone, licenseNumber, status, rating, totalDeliveries)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    drivers.forEach(d => driverStmt.run(d.name, d.phone, d.licenseNumber, d.status, d.rating, d.totalDeliveries));
    console.log(`[Seed] Added ${drivers.length} drivers`);

    // Seed Vehicles
    const vehicles = [
      { plateNumber: "ABC-1234", model: "تويوتا هايلوكس", year: 2022, capacity: 1000, status: "active" },
      { plateNumber: "XYZ-5678", model: "نيسان باترول", year: 2021, capacity: 800, status: "active" },
      { plateNumber: "DEF-9012", model: "فورد رابتر", year: 2023, capacity: 1200, status: "active" },
    ];

    const vehicleStmt = database.prepare(`
      INSERT OR IGNORE INTO vehicles (plateNumber, model, year, capacity, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    vehicles.forEach(v => vehicleStmt.run(v.plateNumber, v.model, v.year, v.capacity, v.status));
    console.log(`[Seed] Added ${vehicles.length} vehicles`);

    // Seed Shipments
    const shipments = [
      { shipmentNumber: "SHP-001", customerName: "شركة النور", destination: "الرياض", status: "pending", totalCost: 50000, distance: 50 },
      { shipmentNumber: "SHP-002", customerName: "مؤسسة الأمل", destination: "جدة", status: "in_transit", totalCost: 75000, distance: 80 },
      { shipmentNumber: "SHP-003", customerName: "شركة الفجر", destination: "الدمام", status: "delivered", totalCost: 60000, distance: 60 },
      { shipmentNumber: "SHP-004", customerName: "مؤسسة السلام", destination: "مكة", status: "pending", totalCost: 45000, distance: 40 },
      { shipmentNumber: "SHP-005", customerName: "شركة النجاح", destination: "المدينة", status: "in_transit", totalCost: 55000, distance: 55 },
    ];

    const shipmentStmt = database.prepare(`
      INSERT OR IGNORE INTO shipments (shipmentNumber, customerName, destination, status, totalCost, distance, scheduledDate)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))
    `);

    shipments.forEach((s, i) => shipmentStmt.run(s.shipmentNumber, s.customerName, s.destination, s.status, s.totalCost, s.distance, i + 1));
    console.log(`[Seed] Added ${shipments.length} shipments`);

    // Seed Technicians
    const technicians = [
      { name: "عبدالله أحمد", phone: "0501111111", specialization: "كهرباء", status: "active", rating: 5, totalJobs: 80 },
      { name: "سعيد محمد", phone: "0502222222", specialization: "ميكانيكا", status: "active", rating: 4, totalJobs: 65 },
      { name: "فهد علي", phone: "0503333333", specialization: "تكييف", status: "active", rating: 5, totalJobs: 90 },
    ];

    const techStmt = database.prepare(`
      INSERT OR IGNORE INTO technicians (name, phone, specialization, status, rating, totalJobs)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    technicians.forEach(t => techStmt.run(t.name, t.phone, t.specialization, t.status, t.rating, t.totalJobs));
    console.log(`[Seed] Added ${technicians.length} technicians`);

    // Seed Spare Parts
    const spareParts = [
      { partNumber: "PART-001", partName: "فلتر زيت", category: "محرك", quantity: 50, unitPrice: 5000, minStockLevel: 20, supplier: "مورد أ" },
      { partNumber: "PART-002", partName: "فلتر هواء", category: "محرك", quantity: 15, unitPrice: 3000, minStockLevel: 20, supplier: "مورد ب" },
      { partNumber: "PART-003", partName: "بطارية", category: "كهرباء", quantity: 30, unitPrice: 50000, minStockLevel: 10, supplier: "مورد ج" },
      { partNumber: "PART-004", partName: "إطار", category: "عجلات", quantity: 8, unitPrice: 80000, minStockLevel: 15, supplier: "مورد د" },
    ];

    const partStmt = database.prepare(`
      INSERT OR IGNORE INTO spareParts (partNumber, partName, category, quantity, unitPrice, minStockLevel, supplier)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    spareParts.forEach(p => partStmt.run(p.partNumber, p.partName, p.category, p.quantity, p.unitPrice, p.minStockLevel, p.supplier));
    console.log(`[Seed] Added ${spareParts.length} spare parts`);

    // Seed Maintenance Requests
    const requests = [
      { requestNumber: "MNT-001", assetType: "vehicle", assetName: "ABC-1234", issueDescription: "تغيير زيت المحرك", priority: "medium", status: "pending", estimatedCost: 50000 },
      { requestNumber: "MNT-002", assetType: "vehicle", assetName: "XYZ-5678", issueDescription: "إصلاح الفرامل", priority: "high", status: "in_progress", estimatedCost: 80000 },
      { requestNumber: "MNT-003", assetType: "equipment", assetName: "مولد كهربائي", issueDescription: "صيانة دورية", priority: "low", status: "completed", estimatedCost: 30000, actualCost: 28000 },
      { requestNumber: "MNT-004", assetType: "vehicle", assetName: "DEF-9012", issueDescription: "تغيير الإطارات", priority: "high", status: "pending", estimatedCost: 120000 },
    ];

    const reqStmt = database.prepare(`
      INSERT OR IGNORE INTO maintenanceRequests (requestNumber, assetType, assetName, issueDescription, priority, status, estimatedCost, actualCost, scheduledDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' days'))
    `);

    requests.forEach((r, i) => reqStmt.run(r.requestNumber, r.assetType, r.assetName, r.issueDescription, r.priority, r.status, r.estimatedCost, r.actualCost || null, i + 1));
    console.log(`[Seed] Added ${requests.length} maintenance requests`);

    // Seed Payments
    const payments = [
      { paymentNumber: "PAY-001", paymentType: "supplier", amount: 100000, paymentDate: "2024-12-01", paymentMethod: "تحويل بنكي", status: "completed", description: "دفعة للمورد أ" },
      { paymentNumber: "PAY-002", paymentType: "salary", amount: 150000, paymentDate: "2024-12-01", paymentMethod: "نقدي", status: "completed", description: "رواتب الموظفين" },
      { paymentNumber: "PAY-003", paymentType: "rent", amount: 50000, paymentDate: "2024-12-01", paymentMethod: "شيك", status: "completed", description: "إيجار المكتب" },
    ];

    const payStmt = database.prepare(`
      INSERT OR IGNORE INTO payments (paymentNumber, paymentType, amount, paymentDate, paymentMethod, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    payments.forEach(p => payStmt.run(p.paymentNumber, p.paymentType, p.amount, p.paymentDate, p.paymentMethod, p.status, p.description));
    console.log(`[Seed] Added ${payments.length} payments`);

    // Seed Receipts
    const receipts = [
      { receiptNumber: "REC-001", receiptType: "sales", amount: 200000, receiptDate: "2024-12-01", paymentMethod: "تحويل بنكي", status: "completed", description: "مبيعات العميل أ" },
      { receiptNumber: "REC-002", receiptType: "sales", amount: 150000, receiptDate: "2024-12-02", paymentMethod: "نقدي", status: "completed", description: "مبيعات العميل ب" },
      { receiptNumber: "REC-003", receiptType: "service", amount: 80000, receiptDate: "2024-12-03", paymentMethod: "شيك", status: "completed", description: "خدمات صيانة" },
    ];

    const recStmt = database.prepare(`
      INSERT OR IGNORE INTO receipts (receiptNumber, receiptType, amount, receiptDate, paymentMethod, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    receipts.forEach(r => recStmt.run(r.receiptNumber, r.receiptType, r.amount, r.receiptDate, r.paymentMethod, r.status, r.description));
    console.log(`[Seed] Added ${receipts.length} receipts`);

    // Seed Bank Transactions
    const bankTxns = [
      { transactionNumber: "BNK-001", bankName: "البنك الأهلي", transactionType: "credit", amount: 200000, transactionDate: "2024-12-01", description: "إيداع من العميل", reconciled: 1 },
      { transactionNumber: "BNK-002", bankName: "بنك الراجحي", transactionType: "debit", amount: 100000, transactionDate: "2024-12-01", description: "دفع للمورد", reconciled: 0 },
      { transactionNumber: "BNK-003", bankName: "البنك الأهلي", transactionType: "credit", amount: 150000, transactionDate: "2024-12-02", description: "تحويل من عميل", reconciled: 0 },
    ];

    const bankStmt = database.prepare(`
      INSERT OR IGNORE INTO bankTransactions (transactionNumber, bankName, transactionType, amount, transactionDate, description, reconciled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    bankTxns.forEach(b => bankStmt.run(b.transactionNumber, b.bankName, b.transactionType, b.amount, b.transactionDate, b.description, b.reconciled));
    console.log(`[Seed] Added ${bankTxns.length} bank transactions`);

    // Seed Checks
    const checks = [
      { checkNumber: "CHK-001", checkType: "receivable", amount: 100000, issueDate: "2024-12-01", dueDate: "2024-12-15", bankName: "البنك الأهلي", status: "pending" },
      { checkNumber: "CHK-002", checkType: "payable", amount: 80000, issueDate: "2024-12-01", dueDate: "2024-12-10", bankName: "بنك الراجحي", status: "pending" },
      { checkNumber: "CHK-003", checkType: "receivable", amount: 120000, issueDate: "2024-11-20", dueDate: "2024-12-05", bankName: "البنك الأهلي", status: "pending" },
    ];

    const checkStmt = database.prepare(`
      INSERT OR IGNORE INTO checks (checkNumber, checkType, amount, issueDate, dueDate, bankName, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    checks.forEach(c => checkStmt.run(c.checkNumber, c.checkType, c.amount, c.issueDate, c.dueDate, c.bankName, c.status));
    console.log(`[Seed] Added ${checks.length} checks`);

    console.log("[Seed] ✅ All sample data added successfully!");
    return true;
  } catch (error) {
    console.error("[Seed] Error adding sample data:", error);
    return false;
  }
}
