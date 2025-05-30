frappe.ui.form.on('Daily Production', {
    refresh(frm) {
        frm.set_query('batch', 'raw_material_items', function (doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: [
                    ["Batch", "item", "=", d.item_code],
                    ["Batch", "batch_qty", ">", 0]
                ]
            };
        });
        frm.set_query('item_code', 'sami_finished_item', function (doc, cdt, cdn) {
            return {
                filters: [
                    ["Item", "item_group", "=", "By Products"]
                ]
            };
        });
        calculate_time_difference(frm);
    }, mill_on_time: function (frm) {
        calculate_time_difference(frm);
    }, mill_off_time: function (frm) {
        calculate_time_difference(frm);
    },
    qty: function (frm) {
        finished_item_rate(frm);
    }
});

frappe.ui.form.on('Raw Material Items', {
    qty: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    },
    wastage_percentage: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    },
    rate: function (frm, cdt, cdn) {
        calculate_waste_weight(frm, cdt, cdn);
        raw_material_items_totals(frm);
    }
});
frappe.ui.form.on("Finish Items", {
    qty: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    ovals: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    end_cutts: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    rate: function (frm, cdt, cdn) {
        calculate_net_qty(frm, cdt, cdn);
        finish_items_totals(frm);
    },
    finish_items_add: function (frm, cdt, cdn) {
        frappe.model.set_value(cdt, cdn, 'rate', frm.fields_dict['raw_material_items'].grid.data[0].rate);
        // END CUSTOM
    }
});

frappe.ui.form.on("Sami Finished Item", {
    qty: function (frm, cdt, cdn) {
        calculate_net_qty_amount(frm, cdt, cdn);
    },
    m_rate: function (frm, cdt, cdn) {
        var d = locals[cdt][cdn];
        frappe.model.set_value(d.doctype, d.name, "amount", flt(d.qty) * flt(d.m_rate));
        calculate_net_qty_amount(frm, cdt, cdn);
    },
    bags: function (frm, cdt, cdn) {
        calculate_net_qty_amount(frm, cdt, cdn);
    }
});

frappe.ui.form.on("Overhead Process Charges", {
    amount: function (frm, cdt, cdn) {
        calculate_total_charges(frm, cdt, cdn);
    }
});

function calculate_total_charges(frm) {
    let total = 0;

    (frm.doc.overhead_process_charges || []).forEach(item => {
        total += flt(item.amount);
    });

    frm.set_value("total_charges", total);
}

function calculate_time_difference(frm) {
    if (frm.doc.mill_on_time && frm.doc.mill_off_time) {
        const millOnTime = moment(frm.doc.mill_on_time, "HH:mm:ss A");
        const millOffTime = moment(frm.doc.mill_off_time, "HH:mm:ss A");

        // Calculate the difference in hours
        const duration = moment.duration(millOffTime.diff(millOnTime));
        const hours = duration.asHours();

        // You can update a field with the calculated hours or display it
        frm.set_value('net_hours', hours);

        // Refresh the field to show the updated value
        frm.refresh_field('net_hours');
    }
}

function raw_material_items_totals(frm) {
    var raw_material_items = frm.doc.raw_material_items;
    frm.doc.total_raw_material_qty = 0;
    frm.doc.total_raw_material_wastage_weight = 0;
    frm.doc.total_raw_material_net_weight = 0;
    frm.doc.total_raw_material_amount = 0;

    for (var i in raw_material_items) {
        frm.doc.total_raw_material_qty += raw_material_items[i].qty || 0;
        frm.doc.total_raw_material_wastage_weight += raw_material_items[i].wastage_weight || 0;
        frm.doc.total_raw_material_net_weight += raw_material_items[i].net_weight || 0;
        frm.doc.total_raw_material_amount += raw_material_items[i].amount || 0;
    }

    frm.refresh_field("total_raw_material_qty");
    frm.refresh_field("total_raw_material_wastage_weight");
    frm.refresh_field("total_raw_material_net_weight");
    frm.refresh_field("total_raw_material_amount");
}

function calculate_waste_weight(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var wastage_weight = flt(d.qty) * (flt(d.wastage_percentage || 0) / 100);
    var net_weight = flt(d.qty) - wastage_weight;
    frappe.model.set_value(d.doctype, d.name, "amount", (net_weight || 0) * flt(d.rate));
    frappe.model.set_value(d.doctype, d.name, "wastage_weight", wastage_weight);
    frappe.model.set_value(d.doctype, d.name, "net_weight", net_weight);
}

function finish_items_totals(frm) {
    var finish_items = frm.doc.finish_items;
    frm.doc.total_finish_qty = 0;
    frm.doc.total_finish_ovals = 0;
    frm.doc.total_finish_end_cutts = 0;
    frm.doc.total_finish_net_qty = 0;
    frm.doc.total_amount = 0;

    for (var i in finish_items) {
        frm.doc.total_finish_qty += finish_items[i].qty || 0;
        frm.doc.total_finish_ovals += finish_items[i].ovals || 0;
        frm.doc.total_finish_end_cutts += finish_items[i].end_cutts || 0;
        frm.doc.total_finish_net_qty += finish_items[i].net_qty || 0;
        frm.doc.total_amount += finish_items[i].amount || 0;
    }

    frm.refresh_field("total_finish_qty");
    frm.refresh_field("total_finish_ovals");
    frm.refresh_field("total_finish_end_cutts");
    frm.refresh_field("total_finish_net_qty");
    frm.refresh_field("total_amount");
}

function calculate_net_qty(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    var net_qty = flt(d.qty) - (flt(d.ovals || 0) + flt(d.end_cutts || 0));
    frappe.model.set_value(d.doctype, d.name, "net_qty", net_qty || 0);
    frappe.model.set_value(d.doctype, d.name, "amount", net_qty * flt(d.rate) || 0);
}

function calculate_net_qty_amount(frm) {
    let total_amount = 0;
    let total_qty = 0;
    let bags = 0;

    (frm.doc.sami_finished_item || []).forEach(item => {
        total_amount += flt(item.amount);
        total_qty += flt(item.qty);
        bags += flt(item.bags);
    });

    frm.set_value("total_amount", total_amount);
    frm.set_value("total_qty", total_qty);
    frm.set_value("total_bags", bags);
}

function finished_item_rate(frm) {
    let total_amount = flt(frm.doc.total_raw_material_amount || 0) - flt(frm.doc.total_amount || 0) + flt(frm.doc.total_charges || 0);
    let qty = frm.doc.qty || 1;
    let rate = total_amount / qty;
    frm.set_value("rate", rate);
    frm.set_value("amount", rate * qty);
}