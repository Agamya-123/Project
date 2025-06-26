<template>
  <div>
    <div v-if="showLoader" class="loader-overlay">
      <div class="loader"></div>
      <p style="color: white; font-weight: 500;">Loading...</p>
    </div>
    <div class="header">
  <span class="heading">Pincode Management</span>
  <div class="header-actions">
    <input
      class="search-input"
      type="text"
      v-model="searchPincode"
      maxlength="6"
      placeholder="Search Pincode"
      @input="enforceNumericSearch"
    />
    <button class="primary-button" @click="openModal">Add New Pincode</button>
  </div>
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
              <select v-else v-model="row.ruleType" @change="handleRuleTypeChange(row)">
                <option value="MIN_ORDER_VALUE">MIN_ORDER_VALUE</option>
                <option value="AFTER_SALES_SERVICEABILITY">AFTER_SALES_SERVICEABILITY</option>
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
                <select v-if="row.ruleType === 'AFTER_SALES_SERVICEABILITY'" v-model="row.value">
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
                <button class="edit-btn" v-if="!row.editing" @click="startEditingRow(row)">Edit</button>
                <button class="save-btn" v-else @click="saveRow(row)">Save</button>
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
          <option value="AFTER_SALES_SERVICEABILITY">AFTER_SALES_SERVICEABILITY</option>
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
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

const fullData = ref([]);
const showLoader = ref(false);
const showModal = ref(false);
const useMockData = true; // Set to false for real API calls

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
    let data;

    if (useMockData) {
      // Mock API call using JSONPlaceholder
      const resp = await axios.get('https://json-placeholder.mock.beeceptor.com/todos');
      data = resp.data.slice(0, 10).map((item) => ({
        pincode: String(150000 + item.id).padStart(6, '0'), //make sure pincode is 6 digits
        applicationId: `65f437fae78851028707daee${item.id}`, // randon application ID
        status: item.id % 2 === 0 ? 'Active' : 'Inactive', //alternate status
        ruleType: item.id % 2 === 0 ? 'MIN_ORDER_VALUE' : 'AFTER_SALES_SERVICEABILITY', //alternate rule types
        value: item.id % 2 === 0 ? { minOrderValue: Math.floor(Math.random() * 50000) + 5000 } : Math.random() < 0.5, // random value for MIN_ORDER_VALUE or boolean for AFTER_SALES_SERVICEABILITY
        description: item.title, //description from the api 
        editing: false
      }));
    } else {
      // Real API call(from postman for now)
      const resp = await axios.get('/api/v1/checkoutrules', { // replace with your actual API endpoint (change this to your actual API endpoint from vite.config.js & server.js)
        params: { pincode: '457777' },
        headers: {
          'x-application-data': JSON.stringify({
            company_id: '17',
            _id: '65f437fae78851028707daee',
            applicationId: '65f437fae78851028707daee'
          })
        }
      });

      data = resp.data.map((item) => ({
        ...item,
        status: item.isActive ? 'Active' : 'Inactive',
        ruleType: item.ruleType?.trim().toUpperCase(),
        value: item.ruleType === 'MIN_ORDER_VALUE'
          ? { minOrderValue: item.value?.minOrderValue ?? null }
          : typeof item.value === 'boolean' ? item.value : null,
        description: item.message ?? '',
        editing: false
      }));
    }

    fullData.value = data;
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

const startEditingRow = (row) => {
  if (row.ruleType === 'MIN_ORDER_VALUE') {
    row.value = typeof row.value === 'object' && row.value !== null && 'minOrderValue' in row.value
      ? row.value
      : { minOrderValue: null };
  } else if (row.ruleType === 'AFTER_SALES_SERVICEABILITY') {
    row.value = typeof row.value === 'boolean' ? row.value : false;
  }

  row._originalRuleType = row.ruleType;
  row.editing = true;
};



const saveRow = async (row) => {
  if (!isValidPincode(row.pincode)) {
    alert('Please enter a valid 6-digit pincode.');
    return;
  }

  if (!row.applicationId) {
    alert('Application ID cannot be empty.');
    return;
  }

  if (row.ruleType === 'MIN_ORDER_VALUE') {
    if (typeof row.value !== 'object' || row.value === null || !('minOrderValue' in row.value)) {
      row.value = { minOrderValue: parseInt(row.value?.minOrderValue) || null };
    }
  } else if (row.ruleType === 'AFTER_SALES_SERVICEABILITY') {
    if (typeof row.value !== 'boolean') {
      alert('Value must be true or false');
      return;
    }
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

  let structuredValue = null;

  if (newRow.value.ruleType === 'MIN_ORDER_VALUE') {
    const val = newRow.value.value.minOrderValue;
    if (!Number.isInteger(val) || val < -2147483648 || val > 2147483647) {
      alert('Invalid value for MIN_ORDER_VALUE');
      return;
    }
    structuredValue = { minOrderValue: val };
  } else if (newRow.value.ruleType === 'AFTER_SALES_SERVICEABILITY') {
    if (typeof newRow.value.value !== 'boolean') {
      alert('Value must be true/false');
      return;
    }
    structuredValue = newRow.value.value;
  }

  showLoader.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));

  fullData.value.unshift({
    pincode: newRow.value.pincode,
    applicationId: newRow.value.applicationId,
    status: newRow.value.status,
    ruleType: newRow.value.ruleType.trim().toUpperCase(),
    value: structuredValue,
    description: newRow.value.description ?? '',
    editing: false
  });
  currentPage.value = 1;
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

//pagination

const currentPage = ref(1);
const pageSize = ref(5);
const pageSizes = [5, 10, 20, 50];

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

const handleRuleTypeChange = (row) => {
  if (row.ruleType === 'MIN_ORDER_VALUE') {
    row.value = { minOrderValue: null };
  } else if (row.ruleType === 'AFTER_SALES_SERVICEABILITY') {
    row.value = true;
  }
};

const searchPincode = ref('');
watch(searchPincode, () => {
  currentPage.value = 1;
});
const enforceNumericSearch = () => {
  searchPincode.value = searchPincode.value.replace(/\D/g, '').slice(0, 6);
};
const filteredData = computed(() => {
  if (!searchPincode.value) return fullData.value;
  return fullData.value.filter(row =>
    String(row.pincode).includes(searchPincode.value)
  );
});
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value));

</script>

<style scoped>
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f0f0f;
  margin: 0;
  padding: 0;
  color: #fff;
}

.header {
  position: sticky;
  top: 0;
  z-index: 999;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 24px 32px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.heading {
  font-size: 32px;
  font-weight: 900;
  color: #00b4d8;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* add pincode button */
.primary-button {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color:  #0a2540;
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transform: scale(1);
}

.primary-button:hover {
  background: rgba(0, 180, 216, 0.3);
  color: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 180, 216, 0.4);
}

/* table  */
.wrapper {
  margin-top: 20px;
  padding: 0 16px;
}

.pincode-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  overflow: hidden;
}

th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
  color: #e0e0e0;
}

th {
  background-color: rgba(24, 70, 88, 0.6);
  color: #fff;
  font-weight: 600;
}

input, select {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  transition: 0.3s;
}

input::placeholder {
  color: #ccc;
}

input:focus, select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(0, 180, 216, 0.4);
}

.action-buttons {
  display: flex;
  gap: 8px;
}
/* edit/save and delete button */
.edit-btn, .save-btn, .delete-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
  backdrop-filter: blur(6px);
  transition: all 0.3s ease;
  transform: scale(1);
}

.edit-btn {
  background: rgba(0, 180, 216, 0.3);
  color: #fff;
  border: 1px solid rgba(0, 180, 216, 0.6);
}

.edit-btn:hover {
  background: rgba(0, 180, 216, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 180, 216, 0.4);
}

.save-btn {
  background: rgba(0, 200, 83, 0.3);
  color: #fff;
  border: 1px solid rgba(0, 200, 83, 0.6);
}

.save-btn:hover {
  background: rgba(0, 200, 83, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
}

.delete-btn {
  background: rgba(244, 67, 54, 0.3);
  color: #fff;
  border: 1px solid rgba(244, 67, 54, 0.6);
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.5);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32px 0 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  gap: 16px;
  flex-wrap: wrap;
}

.size-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  color: #fff;
}

.size-selector label {
  white-space: nowrap;
}

.size-selector select {
  padding: 10px 14px;
  font-size: 15px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: 0.3s ease;
}

.size-selector select:hover {
  background: rgba(255, 255, 255, 0.25);
}
.page-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
}

.page-buttons button {
  padding: 10px 16px;
  font-size: 15px;
  font-weight: bold;
  background-color: rgba(0, 180, 216, 0.3);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s ease;
  backdrop-filter: blur(6px);
}

.page-buttons button:hover {
  background-color: rgba(0, 180, 216, 0.5);
  transform: scale(1.05);
  box-shadow: 0 3px 12px rgba(0, 180, 216, 0.4);
}

.page-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/*  modal overlay */
.add-pin-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.add-pin-content {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 32px 28px;
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #fff;
}

.add-pin-content h3 {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  color: #ffffff;
  margin-bottom: 8px;
}

/* Wrapper to keep input + error aligned */
.add-pin-content input,
.add-pin-content select {
  background: rgba(255, 255, 255, 0.25);
  color: #000;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 12px;
  border-radius: 12px;
  font-size: 15px;
  width: 100%;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.add-pin-content input::placeholder {
  color: #333;
}

.add-pin-content input:focus,
.add-pin-content select:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(24, 70, 88, 0.3);
}

.add-pin-content small.error {
  font-size: 13px;
  color: #f44336;
  margin-top: -4px;
  margin-bottom: -4px;
  padding-left: 4px;
}

/* Group fields neatly */
.add-pin-content > input,
.add-pin-content > select,
.add-pin-content > .field-wrapper,
.add-pin-content > small {
  margin-top: 0px;
}

/* Modal footer buttons */
.app-pin-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.app-pin-footer .primary-button,
.app-pin-footer .cancel-button {
  border: none;
  padding: 10px 18px;
  font-weight: bold;
  font-size: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
  transform: scale(1);
}

.app-pin-footer .primary-button {
  background: rgba(24, 70, 88, 0.4);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.app-pin-footer .primary-button:hover {
  background: rgba(24, 70, 88, 0.6);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(24, 70, 88, 0.4);
}

.app-pin-footer .cancel-button {
  background: rgba(255, 255, 255, 0.4);
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.app-pin-footer .cancel-button:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
/* Loader */
.loader-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loader {
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top: 6px solid #00b4d8;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* disable spinner */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}
.search-input {
  width: 220px;
  padding: 10px 14px;
  font-size: 15px;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  transition: 0.3s ease;
}
.search-input::placeholder {
  color: #ccc;
}

.search-input:focus {
  outline: none;
  background-color: rgba(255,255,255,0.3);
  box-shadow: 0 0 0 2px rgba(0,180,216,0.4);
}
</style>
