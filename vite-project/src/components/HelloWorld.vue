<template>

  <div>
    <div class="header">
      <span class="heading">Pincode Management</span>
    </div>

    <div class="table-wrapper">
      <table class="pincode-table">
        <thead>
          <tr>
            <th>Pincode</th>
            <th>Application ID</th>
            <th>Status</th>
            <th>Rule Type</th>
            <th>Value</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in fullData" :key="index">
            <td>
              <span v-if="!row.editing">{{ row.pincode }}</span>
              <div v-else>
                <input type="text" v-model="row.pincode" maxlength="6" placeholder="Enter Pincode" @input="enforceNumeric(row)"/>
                <small v-if="!isValidPincode(row.pincode)" style="color: red;">
                  Invalid pincode
                </small>
              </div>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.applicationId || 'N/A' }}</span>
              <input v-else type="text" v-model="row.applicationId" placeholder="Enter Application ID"/>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.status }}</span>
              <select v-else v-model="row.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.ruleType }}</span>
              <select v-else v-model="row.ruleType">
                <option value="MIN_ORDER_VALUE">MIN_ORDER_VALUE</option>
                <option value="AFTER_SALES_SERVICEABILITY">AFTER_SALES_SERVICEABILITY</option>
              </select>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.value }}</span>
              <template v-else>
                <select v-if="row.ruleType === 'AFTER_SALES_SERVICEABILITY'" v-model="row.value">
                  <option :value="true">True</option>
                  <option :value="false">False</option>
                </select>
                <input v-else type="number" :min="-2147483648" :max="2147483647" v-model.number="row.value" placeholder="Enter value"/>
              </template>
            </td>

            <td>
              <span v-if="!row.editing">{{ row.description }}</span>
              <input v-else type="text" v-model="row.description" />
            </td>

            <td>
              <button v-if="!row.editing" @click="startEditing(index)" style="margin-right: 8px;">Edit</button>
              <button v-else @click="saveRow(index)" style="margin-right: 8px;">Save</button>
              <button @click="deleteRow(index)">Delete</button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="7">
              <button @click="addNewRow">Add New Pincode</button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const fullData = reactive([

]);

const isValidPincode = (value) => {
  const pin = String(value).trim();
  return /^\d{6}$/.test(pin) && Number(pin) >= 100000 && Number(pin) <= 999999;
};

const enforceNumeric = (row) => {
  row.pincode = row.pincode.replace(/\D/g, '').slice(0,6);
};

const startEditing = (index) => {
  fullData[index].editing = true;
};

const saveRow = (index) => {
  const row = fullData[index];

  if (!isValidPincode(row.pincode)) {
    alert('Please enter a valid 6-digit pincode.');
    return;
  }
  
  if (!row.applicationId){
    alert('Application ID cannot be empty.');
    return;
  }

  if (row.ruleType === 'MIN_ORDER_VALUE') {
    const val = row.value;
    if (!Number.isInteger(val) || val < -2147483648 || val > 2147483647) {
      alert('Value must be a 32-bit integer');
      return;
    }
  }

  if (row.ruleType === 'AFTER_SALES_SERVICEABILITY' && typeof row.value !== 'boolean') {
    alert('Value must be true or false');
    return;
  }

  row.editing = false;
};

const deleteRow = (index) => {
  if (confirm(`Are you sure you want to delete pincode?`)) {
    fullData.splice(index, 1);
  }
};

const addNewRow = () => {
  fullData.push({
    pincode: '',
    status: '',
    ruleType: '',
    value: 0,
    description: '',
    editing: true,
  });
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.table-wrapper {
  margin-top: 24px;
}

.pincode-table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  text-align: left;
}

th {
  background-color: black;
  color: white;
}

select,
input[type="text"],
input[type="number"] {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 100%;
  box-sizing: border-box;
}
</style>