import sys
import os
from twocaptcha import TwoCaptcha

def solve_arkose(site_key, url, api_key):
    try:
        solver = TwoCaptcha(api_key)
        print(f"DEBUG: Solving FunCaptcha for {url} with site_key {site_key}...")
        
        result = solver.fun_captcha(
            sitekey=site_key,
            url=url,
            surl='https://client-api.arkoselabs.com'
        )
        
        if result and 'code' in result:
            print(f"SUCCESS_TOKEN:{result['code']}")
            return True
        else:
            print("ERROR: No code returned from solver.")
            return False
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("USAGE: python solve_captcha.py <site_key> <page_url>")
        sys.exit(1)

    s_key = sys.argv[1]
    p_url = sys.argv[2]
    a_key = os.getenv('CAPTCHA_SOLVER_API_KEY')

    if not a_key:
        print("ERROR: CAPTCHA_SOLVER_API_KEY env var not set.")
        sys.exit(1)

    solve_arkose(s_key, p_url, a_key)
