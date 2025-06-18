<template>
  <div>
    <div v-if="showLoader" class="loader-overlay">
      <div class="loader"></div>
      <p style="color: black; font-weight: 500;">Loading...</p>
    </div>
    <div class="header">
      <span class="heading">Pincode Management</span>
      <button class="primary-button" @click="openModal">Add New Pincode</button>
    </div>
    <div class="wrapper">
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
                <input type="text" v-model="row.pincode" maxlength="6" placeholder="Enter Pincode" @input="enforceNumeric(row)" />
                <small v-if="!isValidPincode(row.pincode)" class="error">Invalid pincode</small>
              </div>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.applicationId || 'N/A' }}</span>
              <input v-else type="text" v-model="row.applicationId" placeholder="Enter Application ID" />
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
                <option value="MIN ORDER VALUE">MIN ORDER VALUE</option>
                <option value="AFTER SALES SERVICEABILITY">AFTER SALES SERVICEABILITY</option>
              </select>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.value }}</span>
              <template v-else>
                <select v-if="row.ruleType === 'AFTER SALES SERVICEABILITY'" v-model="row.value">
                  <option :value="true">True</option>
                  <option :value="false">False</option>
                </select>
                <input v-else type="number" :min="-2147483648" :max="2147483647" v-model.number="row.value" placeholder="Enter value" />
              </template>
            </td>
            <td>
              <span v-if="!row.editing">{{ row.description }}</span>
              <input v-else type="text" v-model="row.description" placeholder="Enter description" />
            </td>
            <td>
              <div class="action-buttons">
                <button class="edit-btn" v-if="!row.editing" @click="startEditing(index)">Edit</button>
                <button class="save-btn" v-else @click="saveRow(index)">Save</button>
                <button class="delete-btn" @click="deleteRow(index)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showModal" class="app-pin-overlay">
      <div class="add-pin-content">
        <h3>Add New Pincode</h3>
        <input type="text" v-model="newRow.pincode" placeholder="Enter Pincode" @input="enforceNumeric(newRow)" />
        <small v-if="!isValidPincode(newRow.pincode)" class="error">Invalid pincode</small>
        <input type="text" v-model="newRow.applicationId" placeholder="Application ID" />
        <select v-model="newRow.status">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select v-model="newRow.ruleType">
          <option value="MIN ORDER VALUE">MIN ORDER VALUE</option>
          <option value="AFTER SALES SERVICEABILITY">AFTER SALES SERVICEABILITY</option>
        </select>
        <div class="field-wrapper">
          <input v-if="newRow.ruleType === 'MIN ORDER VALUE'" type="number" v-model.number="newRow.value" placeholder="Enter Value" />
          <select v-else v-model="newRow.value">
            <option :value="true">True</option>
            <option :value="false">False</option>
          </select>
        </div>
        <input type="text" v-model="newRow.description" placeholder="Description" />
        <div class="app-pin-footer">
          <button class="primary-button" @click="saveNewRow">Save</button>
          <button class="cancel-button" @click="showModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
const fullData = reactive([]);
const showLoader = ref(false);
const showModal = ref(false);
const newRow = reactive({
  pincode: '',
  applicationId: '',
  status: '',
  ruleType: '',
  value: 0,
  description: '',
});
const openModal = () => {
  Object.assign(newRow, {
    pincode: '',
    applicationId: '',
    status: '',
    ruleType: '',
    value: 0,
    description: '',
  });
  showModal.value = true;
};
const saveNewRow = async () => {
  if (!isValidPincode(newRow.pincode)) {
    alert('Invalid pincode');
    return;
  }
  if (!newRow.applicationId) {
    alert('Application ID required');
    return;
  }
  if (newRow.ruleType === 'MIN ORDER VALUE' && (!Number.isInteger(newRow.value) || newRow.value < -2147483648 || newRow.value > 2147483647)) {
    alert('Invalid value for MIN ORDER VALUE');
    return;
  }
  if (newRow.ruleType === 'AFTER SALES SERVICEABILITY' && typeof newRow.value !== 'boolean') {
    alert('Value must be true/false');
    return;
  }
  showLoader.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  fullData.push({ ...newRow, editing: false });
  showLoader.value = false;
  showModal.value = false;
};
const isValidPincode = (value) => {
  const pin = String(value).trim();
  return /^\d{6}$/.test(pin) && Number(pin) >= 100000 && Number(pin) <= 999999;
};
const enforceNumeric = (row) => {
  row.pincode = row.pincode.replace(/\D/g, '').slice(0, 6);
};
const startEditing = (index) => {
  fullData[index].editing = true;
};
const saveRow = async (index) => {
  const row = fullData[index];

  if (!isValidPincode(row.pincode)) {
    alert('Please enter a valid 6-digit pincode.');
    return;
  }
  if (!row.applicationId) {
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
  showLoader.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  showLoader.value = false;
  row.editing = false;
};
const deleteRow = (index) => {
  if (confirm(`Are you sure you want to delete this pincode?`)) {
    fullData.splice(index, 1);
  }
};
</script>

<style scoped>
body {
  font-family: 'Arial', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 0 8px;
}

.heading {
  font-size: 28px;
  font-weight: 800;
  color: rgb(223, 223, 223);
}

.primary-button {
  background: linear-gradient(135deg, #184658, #286f8a);
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
}

.primary-button:hover {
  opacity: 0.9;
}

.wrapper {
  margin-top: 20px;
  overflow-x: auto;
}

.pincode-table {
  width: 100%;
  border-collapse: collapse;
  background-color:black;
}

th,
td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid black;
  font-size: 15px;
  color: white;
}

th {
  background-color: #184658;
  color: white;
}

input,
select {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  background-color: #f9f9f9;
  color: #000;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.edit-btn,
.save-btn,
.delete-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.edit-btn {
  background-color: #2196f3;
  color: #212121;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.app-pin-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.add-pin-content {
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-pin-content h3 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  color: #184658;
}

.app-pin-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.cancel-button {
  background-color: #dee2e6;
  color: #212529;
  border: 1px solid #adb5bd;
  border-radius: 6px;
  font-weight: bold;
  padding: 10px 14px;
  cursor: pointer;
}

.error {
  color: red;
  font-size: 13px;
  margin-top: 4px;
}

.loader-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.loader {
  border: 6px solid #f3f3f3;
  border-top: 6px solid #184658;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

</style>