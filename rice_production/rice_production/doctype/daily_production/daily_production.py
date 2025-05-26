import frappe
from frappe.model.document import Document


class DailyProduction(Document):
    def on_submit(self):
        # STOCK ENTRY SAVING
        doc = frappe.new_doc("Stock Entry")
        doc.stock_entry_type = "Repack"
        doc.purpose = "Repack"
        doc.posting_date = self.date
        doc.ref_no = self.name
        doc.ref_doctype = "Daily Production"
        # Append source item
        it = doc.append("items", {})
        it.set_basic_rate_manually = 1
        it.s_warehouse = self.warehouse
        it.item_code = self.raw_material_items[0].item_code
        it.qty = self.total_finish_net_qty
        it.valuation_rate = self.raw_material_items[0].rate
        it.basic_rate = self.raw_material_items[0].rate
        it.amount = self.raw_material_items[0].amount

        # Append target items using a loop
        for item in self.finish_items:
            it = doc.append("items", {})
            it.set_basic_rate_manually = 1
            it.t_warehouse = item.warehouse
            it.item_code = item.item_code
            it.qty = item.net_qty
            it.valuation_rate = item.rate
            it.basic_rate = item.rate
            it.basic_amount = item.amount

        try:
            doc.ignore_validation = True
            doc.save()
            doc.submit()
            self.stock_entry = doc.name
            self.save()
        except Exception as e:
            frappe.throw(frappe._("Error submitting Stock Entry: {0}".format(str(e))))
