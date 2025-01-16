import os
from dotenv import load_dotenv
import json
import requests
from typing import List, Dict, Any
import re

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file")

def parse_table_definition(definition: str) -> List[Dict[str, Any]]:
    """Parse table definition from Content-Profile header"""
    columns = []
    if not definition:
        return columns
    
    # Split into lines and remove empty ones
    lines = [line.strip() for line in definition.split('\n') if line.strip()]
    
    for line in lines:
        if line.startswith('|') or line.startswith('+'):  # Skip separator lines
            continue
        
        # Parse column definition
        parts = line.strip().split()
        if len(parts) >= 2:
            column = {
                'name': parts[0],
                'type': parts[1],
                'nullable': 'NOT NULL' not in line,
                'primary': 'PRIMARY KEY' in line,
                'default': None
            }
            
            # Extract default value if exists
            default_match = re.search(r'DEFAULT ([^,\s]+)', line)
            if default_match:
                column['default'] = default_match.group(1)
            
            columns.append(column)
    
    return columns

def fetch_supabase_schema():
    # Headers for REST API requests
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    # Get list of tables
    response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
    if response.status_code != 200:
        print(f"Error fetching schema information: {response.status_code}")
        print(response.text)
        return
    
    # Get tables from paths
    paths = response.json().get('paths', {})
    tables = set()
    for path in paths:
        parts = path.strip('/').split('/')
        if len(parts) == 1 and parts[0] not in ['rpc', 'graphql', '']:
            tables.add(parts[0])
    
    tables = sorted(list(tables))
    
    # Generate markdown content
    md_content = "# Supabase Public Schema Tables\n\n"
    md_content += f"Total number of tables found: {len(tables)}\n\n"
    
    # Process each table
    for table_name in tables:
        print(f"Processing table: {table_name}")
        
        # Get table structure
        table_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}",
            headers={**headers, 'Prefer': 'return=representation'},
            params={'select': '*', 'limit': 0}
        )
        
        md_content += f"## Table: {table_name}\n\n"
        
        # Add column information in table format
        md_content += "| Column Name | Type | Default Value | Primary |\n"
        md_content += "|------------|------|---------------|---------|"
        
        if table_response.status_code == 200:
            # Get and parse table definition
            definition = table_response.headers.get('Content-Profile', '')
            columns = parse_table_definition(definition)
            
            # Sort columns: primary keys first, then alphabetically
            columns.sort(key=lambda x: (not x['primary'], x['name']))
            
            for column in columns:
                default = column['default'] if column['default'] else ('NOT NULL' if not column['nullable'] else 'NULL')
                md_content += f"\n| {column['name']} | {column['type']} | {default} | {'Yes' if column['primary'] else 'No'} |"
        
        md_content += "\n\n"
        
        # Try to get sample data
        try:
            data_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table_name}",
                headers={**headers, 'Prefer': 'count=exact'},
                params={'select': '*', 'limit': 1}
            )
            
            if data_response.status_code == 200:
                if data_response.json():
                    md_content += "### Sample Data\n"
                    md_content += "```json\n"
                    md_content += json.dumps(data_response.json()[0], indent=2)
                    md_content += "\n```\n\n"
                
                # Get total count if available
                count = data_response.headers.get('content-range', '').split('/')[-1]
                if count and count.isdigit():
                    md_content += f"Total rows: {count}\n"
            else:
                md_content += "*No data available or table not accessible*\n"
        except Exception as e:
            print(f"Error getting data for {table_name}: {str(e)}")
            md_content += "*Error accessing table data*\n"
        
        md_content += "\n---\n\n"
    
    # Write to markdown file
    with open('supabase_schema.md', 'w') as f:
        f.write(md_content)
    
    print(f"Schema information has been saved to supabase_schema.md")
    print(f"Found tables: {', '.join(tables)}")

if __name__ == "__main__":
    fetch_supabase_schema() 