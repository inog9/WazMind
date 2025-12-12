"""
XML parser for Wazuh rule files
"""
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def parse_rule_element(rule_elem: ET.Element, file_path: str, source: str) -> Optional[Dict]:
    """Parse a single <rule> element"""
    try:
        rule_id = rule_elem.get('id')
        if not rule_id:
            return None
        
        rule_id = int(rule_id)
        level = int(rule_elem.get('level', 0))
        overwrite = rule_elem.get('overwrite', 'no').lower() == 'yes'
        
        # Extract description
        description_elem = rule_elem.find('description')
        description = description_elem.text.strip() if description_elem is not None and description_elem.text else None
        
        # Extract groups
        group_elem = rule_elem.find('group')
        groups = group_elem.text.strip() if group_elem is not None and group_elem.text else None
        
        # Extract dependencies (if_sid, if_group)
        parent_ids = []
        if_sid_elem = rule_elem.find('if_sid')
        if if_sid_elem is not None and if_sid_elem.text:
            # Can be comma-separated or single value
            parent_ids = [int(p.strip()) for p in if_sid_elem.text.split(',') if p.strip().isdigit()]
        
        # Get file modification time
        file_path_obj = Path(file_path)
        file_mtime = None
        if file_path_obj.exists():
            file_mtime = datetime.fromtimestamp(file_path_obj.stat().st_mtime)
        
        # Get full XML as string
        rule_xml = ET.tostring(rule_elem, encoding='unicode')
        
        return {
            'rule_id': rule_id,
            'level': level,
            'description': description,
            'groups': groups,
            'source': source,
            'file_path': str(file_path),
            'file_name': Path(file_path).name,
            'file_mtime': file_mtime,
            'is_overwritten': 1 if overwrite else 0,
            'rule_xml': rule_xml,
            'parent_rule_ids': ','.join(map(str, parent_ids)) if parent_ids else None
        }
    except Exception as e:
        logger.warning(f"Error parsing rule element: {str(e)}")
        return None

def parse_rules_file(file_path: str, source: str) -> List[Dict]:
    """Parse all rules from a Wazuh XML file"""
    rules = []
    
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Find all <rule> elements
        for rule_elem in root.findall('.//rule'):
            parsed_rule = parse_rule_element(rule_elem, file_path, source)
            if parsed_rule:
                rules.append(parsed_rule)
        
        logger.info(f"Parsed {len(rules)} rules from {file_path}")
    except ET.ParseError as e:
        logger.error(f"XML parse error in {file_path}: {str(e)}")
    except Exception as e:
        logger.error(f"Error parsing file {file_path}: {str(e)}")
    
    return rules

def scan_rules_directory(directory: str, source: str) -> List[Dict]:
    """Scan all XML files in a directory and parse rules"""
    all_rules = []
    directory_path = Path(directory)
    
    if not directory_path.exists():
        logger.warning(f"Directory does not exist: {directory}")
        return all_rules
    
    # Find all XML files
    xml_files = list(directory_path.glob('*.xml'))
    logger.info(f"Found {len(xml_files)} XML files in {directory}")
    
    for xml_file in xml_files:
        rules = parse_rules_file(str(xml_file), source)
        all_rules.extend(rules)
    
    return all_rules

def scan_wazuh_rules(ruleset_path: str, custom_rules_path: str) -> Dict:
    """Scan both default and custom rules directories"""
    logger.info(f"Scanning Wazuh rules from {ruleset_path} and {custom_rules_path}")
    
    default_rules = scan_rules_directory(ruleset_path, 'default')
    
    # If custom path is same as ruleset path, scan for custom rules (ID >= 100000)
    if custom_rules_path == ruleset_path:
        # Filter rules by ID to determine if custom
        all_rules = []
        for rule in default_rules:
            if rule['rule_id'] >= 100000:
                rule['source'] = 'custom'
                all_rules.append(rule)
            else:
                all_rules.append(rule)
        custom_rules = [r for r in all_rules if r['source'] == 'custom']
        default_rules = [r for r in all_rules if r['source'] == 'default']
    else:
        custom_rules = scan_rules_directory(custom_rules_path, 'custom')
        all_rules = default_rules + custom_rules
    
    # Calculate statistics
    total = len(all_rules)
    custom_count = len(custom_rules)
    default_count = len(default_rules)
    overwritten_count = sum(1 for r in all_rules if r.get('is_overwritten', 0) == 1)
    
    logger.info(f"Scan complete: {total} total rules ({default_count} default, {custom_count} custom, {overwritten_count} overwritten)")
    
    return {
        'rules': all_rules,
        'statistics': {
            'total': total,
            'custom': custom_count,
            'default': default_count,
            'overwritten': overwritten_count
        }
    }

