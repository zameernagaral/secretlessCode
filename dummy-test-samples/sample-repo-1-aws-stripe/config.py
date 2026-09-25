# ==============================================================================
# ⚠️ DEMO / TEST FILE ONLY - ALL VALUES BELOW ARE OBVIOUSLY FAKE / DUMMY STRINGS
# DO NOT USE IN PRODUCTION. CREATED SOLELY FOR SCANNER DETECTION DEMONSTRATION.
# ==============================================================================

import os

# FAKE AWS Test Credentials (Format matches AWS Access Token spec)
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_DEFAULT_REGION = "us-east-1"

# FAKE Stripe Test Secret Key (Uses safe test prefix to prevent GitHub push protection triggers)
STRIPE_SECRET_KEY = "sk_test_mockStripeToken9948281048291048"

def init_services():
    print("Initializing demo services with mock test credentials...")
    return {
        "aws_configured": bool(AWS_ACCESS_KEY_ID),
        "stripe_configured": bool(STRIPE_SECRET_KEY)
    }

if __name__ == "__main__":
    init_services()
