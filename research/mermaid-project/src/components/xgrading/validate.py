import subprocess
import tempfile
import os
import re
import ast
import json
from flask import jsonify, request

def setup_validation_routes(app):
    """
    Set up validation routes for a Flask application.
    
    Args:
        app: The Flask application to add routes to
    """
    @app.route('/api/validate/java', methods=['POST'])
    def validate_java_code():
        code = request.json.get('code')
        if not code:
            return jsonify({"errors": [{"line": 1, "message": "No code provided", "severity": "error"}]})
        
        # Create a temporary Java file
        with tempfile.NamedTemporaryFile(suffix=".java", delete=False) as temp:
            temp_filename = temp.name
            temp.write(code.encode('utf-8'))
        
        try:
            # Run javac to compile the code
            result = subprocess.run(['javac', temp_filename], 
                                capture_output=True, 
                                text=True)
            
            # If compilation succeeded with no errors
            if result.returncode == 0:
                return jsonify({
                    "success": True,
                    "errors": [{
                        "line": 1,
                        "message": "Code compiles successfully.",
                        "severity": "info"
                    }]
                })
            
            # Parse compiler errors
            errors = []
            error_pattern = re.compile(r'(.+\.java):(\d+): error: (.*)')
            warning_pattern = re.compile(r'(.+\.java):(\d+): warning: (.*)')
            
            for line in result.stderr.split('\n'):
                error_match = error_pattern.search(line)
                warning_match = warning_pattern.search(line)
                
                if error_match:
                    errors.append({
                        "line": int(error_match.group(2)),
                        "message": error_match.group(3),
                        "severity": "error"
                    })
                elif warning_match:
                    errors.append({
                        "line": int(warning_match.group(2)),
                        "message": warning_match.group(3),
                        "severity": "warning"
                    })
            
            return jsonify({
                "success": False,
                "errors": errors if errors else [{
                    "line": 1,
                    "message": "Compilation failed with unrecognized errors.",
                    "severity": "error"
                }]
            })
        
        except Exception as e:
            return jsonify({
                "success": False,
                "errors": [{
                    "line": 1,
                    "message": f"Server error: {str(e)}",
                    "severity": "error"
                }]
            })
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                os.unlink(temp_filename)

    @app.route('/api/validate/python', methods=['POST'])
    def validate_python_code():
        code = request.json.get('code')
        if not code:
            return jsonify({"errors": [{"line": 1, "message": "No code provided", "severity": "error"}]})
        
        errors = []
        
        # First, check syntax with ast.parse
        try:
            ast.parse(code)
        except SyntaxError as e:
            errors.append({
                "line": e.lineno,
                "message": f"Syntax error: {e.msg}",
                "severity": "error"
            })
            return jsonify({"success": False, "errors": errors})
        
        # If syntax is valid, use pylint for more detailed checks
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as temp:
            temp_filename = temp.name
            temp.write(code.encode('utf-8'))
        
        try:
            # Run pylint to check the code
            result = subprocess.run(
                ['pylint', '--output-format=json', temp_filename],
                capture_output=True, 
                text=True
            )
            
            # If pylint is not available, we'll just return the basic syntax check
            if result.returncode != 0 and 'command not found' in result.stderr:
                return jsonify({
                    "success": True,
                    "errors": [{
                        "line": 1,
                        "message": "Basic syntax check passed (pylint not available for detailed analysis)",
                        "severity": "info"
                    }]
                })
            
            # Parse pylint JSON output
            try:
                pylint_results = json.loads(result.stdout)
                
                for issue in pylint_results:
                    severity = "warning"
                    if issue.get('type') in ['error', 'fatal']:
                        severity = "error"
                    elif issue.get('type') in ['convention', 'refactor']:
                        severity = "info"
                    
                    errors.append({
                        "line": issue.get('line', 1),
                        "message": issue.get('message', 'Unknown issue'),
                        "severity": severity
                    })
            except:
                # If JSON parsing fails, just do basic checks
                pass
            
            # If no errors were found by pylint
            if not errors:
                errors.append({
                    "line": 1,
                    "message": "Code looks good!",
                    "severity": "info"
                })
            
            return jsonify({
                "success": len([e for e in errors if e['severity'] == 'error']) == 0,
                "errors": errors
            })
        
        except Exception as e:
            return jsonify({
                "success": False,
                "errors": [{
                    "line": 1,
                    "message": f"Server error: {str(e)}",
                    "severity": "error"
                }]
            })
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                os.unlink(temp_filename)