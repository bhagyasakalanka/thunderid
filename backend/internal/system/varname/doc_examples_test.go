package varname

import "testing"

// The examples in docs/content/guides/resource-export.mdx are pinned here, so a change to the naming
// rule fails a test rather than leaving the guide quietly wrong.
func TestDocumentedExamples(t *testing.T) {
	cases := []struct{ resourceType, resourceName, field, want string }{
		{"application", "My App", "ClientId", "APPLICATION_MY_APP_CLIENT_ID"},
		{"application", "My-App", "ClientId", "APPLICATION_MY_APP_CLIENT_ID"},
		{"application", "My App-", "ClientId", "APPLICATION_MY_APP_CLIENT_ID"},
		{"agent", "My App", "ClientId", "AGENT_MY_APP_CLIENT_ID"},
		{"user", "alice@example.com", "password", "USER_ALICE_EXAMPLE_COM_PASSWORD"},
		{"application", "2FA App", "ClientId", "APPLICATION_2FA_APP_CLIENT_ID"},
	}
	for _, c := range cases {
		if got := DeriveVariableName(c.resourceType, c.resourceName, c.field); got != c.want {
			t.Errorf("DeriveVariableName(%q, %q, %q) = %q, want %q",
				c.resourceType, c.resourceName, c.field, got, c.want)
		}
	}
}
