from flask import Flask, request, jsonify, render_template, send_file
import pdfplumber
import os
app = Flask(__name__)
@app.route('/')
def index():
return render_template('index.html')
@app.route('/sample')
def sample():
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sample_hiring_dataset.pdf'))
return send_file(path, as_attachment=True, download_name="sample_hiring_dataset.pdf")
@app.route('/upload', methods=['POST'])
def upload():
if 'file' not in request.files:
return jsonify({'error': 'No file uploaded'}), 400
file = request.files['file']
if not file.filename.endswith('.pdf'):
return jsonify({'error': 'Please upload a valid PDF file'}), 400
try:
data = []
with pdfplumber.open(file.stream) as pdf:
for page in pdf.pages:
tables = page.extract_tables()
for table in tables:
if not table:
continue
headers = [str(h).strip().replace('\n', '') for h in table[0] if h]
for row in table[1:]:
if row and len(row) == len(headers):
row_dict = {headers[i]: str(row[i]).strip() for i in range(len(headers))}
data.append(row_dict)
if not data:
return jsonify({'error': 'No tabular data found in the PDF. Please upload a PDF containing a
formatted table.'}), 400
# Group stats
groups = {}
for row in data:
gender = row.get('Gender', '').strip()
category = row.get('Category', '').strip()
selected = row.get('Selected', '').strip().lower() in ['yes', 'true', '1']
if not gender or not category:
continue # Skip missing
# Process Gender
if gender not in groups:
groups[gender] = {'type': 'Gender', 'total': 0, 'selected': 0}
groups[gender]['total'] += 1
if selected: groups[gender]['selected'] += 1
# Process Category
if category not in groups:
groups[category] = {'type': 'Category', 'total': 0, 'selected': 0}
groups[category]['total'] += 1
if selected: groups[category]['selected'] += 1
results = []
for name, stats in groups.items():
if stats['total'] > 0:
rate = (stats['selected'] / stats['total']) * 100
results.append({
'name': name,
'type': stats['type'],
'total': stats['total'],
'selected': stats['selected'],
'rate': round(rate, 2)
})
# Bias detection: > 20% diff within same type
is_biased = False
bias_details = []
gender_rates = [r for r in results if r['type'] == 'Gender']
if gender_rates:
max_r = max(gender_rates, key=lambda x: x['rate'])
min_r = min(gender_rates, key=lambda x: x['rate'])
if max_r['rate'] - min_r['rate'] > 20:
is_biased = True
bias_details.append(f"Gender Bias: '{max_r['name']}' candidates ({max_r['rate']}%) are selected
significantly more often than '{min_r['name']}' candidates ({min_r['rate']}%).")
category_rates = [r for r in results if r['type'] == 'Category']
if category_rates:
max_r = max(category_rates, key=lambda x: x['rate'])
min_r = min(category_rates, key=lambda x: x['rate'])
if max_r['rate'] - min_r['rate'] > 20:
is_biased = True
bias_details.append(f"Category Bias: '{max_r['name']}' candidates ({max_r['rate']}%) are
selected significantly more often than '{min_r['name']}' candidates ({min_r['rate']}%).")
return jsonify({
'results': results,
'is_biased': is_biased,
'bias_details': bias_details
})
except Exception as e:
return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
app.run(debug=True, port=5000)
