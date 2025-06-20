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
          <tr v-for="(row, index) in paginatedData" :key="index">
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
                <option value="MIN_ORDER_VALUE">MIN_ORDER_VALUE</option>
                <option value="AFTER SALES SERVICEABILITY">AFTER SALES SERVICEABILITY</option>
              </select>
            </td>
            <td>
              <span v-if="!row.editing">
                <template v-if="row.ruleType === 'MIN_ORDER_VALUE'">
                  ₹{{ row.value?.minOrderValue !== undefined && row.value?.minOrderValue !== null ? row.value.minOrderValue : 'N/A' }}
                </template>
                <template v-else>
                  {{ row.value === true ? 'True' : row.value === false ? 'False' : 'N/A' }}
                </template>
              </span>
              <template v-else>
                <select v-if="row.ruleType === 'AFTER SALES SERVICEABILITY'" v-model="row.value">
                  <option :value="true">True</option>
                  <option :value="false">False</option>
                </select>
                <input v-else type="number" :min="-2147483648" :max="2147483647" v-model.number="row.value.minOrderValue" placeholder="Enter value" />
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
      <div class="pagination-controls">
  <div class="size-selector">
    <label>Rows per page:</label>
    <select v-model="pageSize" @change="changePageSize(pageSize)">
      <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
    </select>
  </div>
  <div class="page-buttons">
    <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Previous</button>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">Next</button>
  </div>
</div>

    </div>

    <div v-if="showModal" class="add-pin-overlay" @click="handleOverlayClick">
      <div class="add-pin-content" @click.stop>
        <h3>Add New Pincode</h3>
        <input type="text" v-model="newRow.pincode" placeholder="Enter Pincode" @input="enforceNumeric(newRow)" />
        <small v-if="!isValidPincode(newRow.pincode)" class="error">Invalid pincode</small>
        <input type="text" v-model="newRow.applicationId" placeholder="Application ID" />
        <select v-model="newRow.status">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select v-model="newRow.ruleType">
          <option value="MIN_ORDER_VALUE">MIN_ORDER_VALUE</option>
          <option value="AFTER SALES SERVICEABILITY">AFTER SALES SERVICEABILITY</option>
        </select>
        <div class="field-wrapper">
          <input v-if="newRow.ruleType === 'MIN_ORDER_VALUE'" type="number" v-model.number="newRow.value.minOrderValue" placeholder="Enter Value" />
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
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const fullData = ref([]);
const showLoader = ref(false);
const showModal = ref(false);

//pagination

const currentPage = ref(1);
const pageSize = ref(5);
const pageSizes = [5, 10, 20, 50];

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return fullData.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(fullData.value.length / pageSize.value));

const changePageSize = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
//end pagination

const newRow = ref({
  pincode: '',
  applicationId: '',
  status: '',
  ruleType: '',
  value: {},
  description: '',
});

const openModal = () => {
  Object.assign(newRow.value, {
    pincode: '',
    applicationId: '',
    status: '',
    ruleType: '',
    value: {},
    description: '',
  });
  showModal.value = true;
};

onMounted(async () => {
  showLoader.value = true;
  try {
    const resp = await axios.get('/api/v1/checkoutrules', {
      params: { pincode: '457777' },
      headers: {
        'x-application-data': JSON.stringify({
          company_id: '17',
          _id: '65f437fae78851028707daee',
          applicationId: '65f437fae78851028707daee'
        })
      }
    });

    const baseData = resp.data.map(item => ({
      ...item,
      status: item.isActive ? 'Active' : 'Inactive',
      value: item.ruleType === 'MIN_ORDER_VALUE'
        ? { minOrderValue: item.value?.minOrderValue ?? null }
        : typeof item.value === 'boolean' ? item.value : null,
      ruleType: item.ruleType?.trim().toUpperCase(),
      description: item.message ?? '',
      editing: false,
    }));

    // Duplicate the base data 150 times (or close to it)
    const multiplied = [];
    for (let i = 0; i < 150; i++) {
      baseData.forEach((item, index) => {
        multiplied.push({
          ...JSON.parse(JSON.stringify(item)),
        });
      });
      if (multiplied.length >= 150) break;
    }

    fullData.value = multiplied.slice(0, 150); 
  } catch (e) {
    console.error('Fetch failed', e);
  } finally {
    showLoader.value = false;
  }
});


const isValidPincode = (value) => {
  const pin = String(value).trim();
  return /^\d{6}$/.test(pin) && Number(pin) >= 100000 && Number(pin) <= 999999;
};

const enforceNumeric = (row) => {
  row.pincode = row.pincode.replace(/\D/g, '').slice(0, 6);
};

const startEditing = (index) => {
  const row = fullData.value[index];
  if (row.ruleType === 'MIN_ORDER_VALUE') {
    if (typeof row.value !== 'object' || row.value === null) {
      row.value = { minOrderValue: 0 };
    }
  }
  row.editing = true;
};

const saveRow = async (index) => {
  const row = fullData.value[index];
  if (!isValidPincode(row.pincode)) {
    alert('Please enter a valid 6-digit pincode.');
    return;
  }
  if (!row.applicationId) {
    alert('Application ID cannot be empty.');
    return;
  }
  if (row.ruleType === 'MIN_ORDER_VALUE') {
    const val = row.value?.minOrderValue;
    if (!Number.isInteger(val) || val < -2147483648 || val > 2147483647) {
      alert('Value must be a 32-bit integer');
      return;
    }
  }
  if (row.ruleType === 'AFTER SALES SERVICEABILITY' && typeof row.value !== 'boolean') {
    alert('Value must be true or false');
    return;
  }

  showLoader.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  row.editing = false;
  showLoader.value = false;
};

const saveNewRow = async () => {
  if (!isValidPincode(newRow.value.pincode)) {
    alert('Invalid pincode');
    return;
  }
  if (!newRow.value.applicationId) {
    alert('Application ID required');
    return;
  }
  if (newRow.value.ruleType === 'MIN_ORDER_VALUE') {
    const val = newRow.value.value.minOrderValue;
    if (!Number.isInteger(val) || val < -2147483648 || val > 2147483647) {
      alert('Invalid value for MIN_ORDER_VALUE');
      return;
    }
  }
  if (newRow.value.ruleType === 'AFTER SALES SERVICEABILITY' && typeof newRow.value.value !== 'boolean') {
    alert('Value must be true/false');
    return;
  }

  showLoader.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  fullData.value.push({
    pincode: newRow.value.pincode,
    applicationId: newRow.value.applicationId,
    status: newRow.value.status,
    ruleType: newRow.value.ruleType,
    value: JSON.parse(JSON.stringify(newRow.value.value)),
    description: newRow.value.description,
    editing: false
  });
  showLoader.value = false;
  showModal.value = false;
};

const deleteRow = (index) => {
  if (confirm(`Are you sure you want to delete this pincode?`)) {
    fullData.value.splice(index, 1);
  }
};

const handleOverlayClick = () => {
  showModal.value = false;
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
  background-color: black;
}
th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid black;
  font-size: 15px;
  color: white;
}
th {
  background-color: #184658;
}
input, select {
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
.edit-btn, .save-btn, .delete-btn {
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
.add-pin-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
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
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 8px 0;
  color: white;
}
.size-selector select {
  padding: 6px;
  font-size: 14px;
  border-radius: 4px;
}
.page-buttons button {
  padding: 6px 12px;
  margin: 0 4px;
  font-size: 14px;
  font-weight: bold;
  background-color: #184658;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.page-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>