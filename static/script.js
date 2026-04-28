lucide.createIcons();
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const errorMsg = document.getElementById('error-message');
const uploadWrapper = document.getElementById('upload-wrapper');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const sampleBtn = document.getElementById('sample-btn');
const resetBtn = document.getElementById('reset-btn');
const homeSection = document.getElementById('home-section');
const getStartedBtn = document.getElementById('get-started-btn');
const homeNavBtn = document.getElementById('home-nav-btn');
let currentResults = null;
let charts = {};
if (getStartedBtn) {
getStartedBtn.addEventListener('click', () => {
homeSection.classList.add('hidden');
uploadWrapper.classList.remove('hidden');
window.scrollTo({ top: 0, behavior: 'smooth' });
});
}
if (homeNavBtn) {
homeNavBtn.addEventListener('click', () => {
homeSection.classList.remove('hidden');
uploadWrapper.classList.add('hidden');
resultsSection.classList.add('hidden');
window.scrollTo({ top: 0, behavior: 'smooth' });
});
}
// Sample Data Logic
sampleBtn.addEventListener('click', () => {
window.location.href = '/sample';
});
// Drag and Drop Logic
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag
over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
e.preventDefault();
dropZone.classList.remove('drag-over');
if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
if (e.target.files.length) handleFile(e.target.files[0]);
});
resetBtn.addEventListener('click', () => {
resultsSection.classList.add('hidden');
uploadWrapper.classList.remove('hidden');
fileInput.value = '';
window.scrollTo({ top: 0, behavior: 'smooth' });
});
function handleFile(file) {
errorMsg.classList.add('hidden');
if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
errorMsg.textContent = "Please upload a valid PDF file";
errorMsg.classList.remove('hidden');
return;
}
const formData = new FormData();
formData.append('file', file);
uploadWrapper.classList.add('hidden');
loading.classList.remove('hidden');
fetch('/upload', {
method: 'POST',
body: formData
})
.then(response => response.json())
.then(data => {
loading.classList.add('hidden');
if (data.error) {
uploadWrapper.classList.remove('hidden');
errorMsg.textContent = data.error;
errorMsg.classList.remove('hidden');
} else {
currentResults = data;
showResults(data);
lucide.createIcons(); // Re-render dynamic icons
}
})
.catch(err => {
loading.classList.add('hidden');
uploadWrapper.classList.remove('hidden');
errorMsg.textContent = "Error processing file: " + err.message;
errorMsg.classList.remove('hidden');
});
}
function showResults(data) {
resultsSection.classList.remove('hidden');
const banner = document.getElementById('bias-banner');
const biasText = document.getElementById('bias-text');
const biasDetails = document.getElementById('bias-details-text');
const complaintBtn = document.getElementById('complaint-btn');
if (data.is_biased) {
banner.className = 'bias-banner bias-detected animate-in';
biasText.textContent = '
⚠
 Potential Bias Detected';
// Show detailed explanation
biasDetails.innerHTML = data.bias_details.join('
');
biasDetails.classList.remove('hidden');
// Show complaint button
complaintBtn.classList.remove('hidden');
// Native alert
setTimeout(() => {
alert("WARNING: Severe bias has been detected in the hiring data!\n\n" +
data.bias_details.join('\n\n'));
}, 100);
} else {
banner.className = 'bias-banner bias-safe animate-in';
biasText.textContent = '
✅
 No Significant Bias Detected';
biasDetails.classList.add('hidden');
complaintBtn.classList.add('hidden');
}
const tbody = document.querySelector('#results-table tbody');
tbody.innerHTML = '';
data.results.forEach(row => {
const tr = document.createElement('tr');
tr.innerHTML = `
${row.name} (${row.type})
${row.total}
${row.selected}
${row.rate}%
`;
tbody.appendChild(tr);
});
renderCharts(data.results);
}
function renderCharts(results) {
const genders = results.filter(r => r.type === 'Gender');
const categories = results.filter(r => r.type === 'Category');
if (charts.gender) charts.gender.destroy();
if (charts.category) charts.category.destroy();
const renderChart = (id, data, color) => {
const ctx = document.getElementById(id).getContext('2d');
return new Chart(ctx, {
type: 'bar',
data: {
labels: data.map(d => d.name),
datasets: [{
label: 'Selection Rate (%)',
data: data.map(d => d.rate),
backgroundColor: color,
borderRadius: 4
}]
},
options: {
scales: {
y: {
beginAtZero: true,
max: 100,
grid: { color: 'rgba(255, 255, 255, 0.05)' },
ticks: { color: '#94a3b8' },
title: { display: true, text: 'Selection Rate (%)', color: '#94a3b8' }
},
x: {
grid: { display: false },
ticks: { color: '#f8fafc' }
}
},
plugins: {
legend: { display: false }
}
}
});
};
charts.gender = renderChart('gender-chart', genders, '#0070f3');
charts.category = renderChart('category-chart', categories, '#00e5ff');
}
document.getElementById('download-btn').addEventListener('click', () => {
if (!currentResults) return;
const blob = new Blob([JSON.stringify(currentResults, null, 2)], { type: 'application/json' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'fairhire_results.json';
a.click();
});
const complaintBtn = document.getElementById('complaint-btn');
if(complaintBtn) {
complaintBtn.addEventListener('click', () => {
if(!currentResults || !currentResults.bias_details) return;
const subject = encodeURIComponent("Complaint: Hiring Bias Detected in Selection Process");
const bodyText = "To Human Resources,\n\nI am writing to file a formal complaint regarding
potential bias detected in the recent candidate selection data.\n\nThe FairHire system detected the
following discrepancies:\n\n" +
currentResults.bias_details.join('\n\n') +
"\n\nPlease review the selection process immediately to ensure equitable hiring
practices.\n\nSincerely,\n[Your Name]";
const body = encodeURIComponent(bodyText);
window.location.href = `mailto:hr@hiringcompany.com?subject=${subject}&body=${body}`;});}
