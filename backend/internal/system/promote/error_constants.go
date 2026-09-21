// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// Client errors for promotion operations.
var (
	// ErrorInvalidRequest is returned when the two deployments a promotion names are missing or equal.
	ErrorInvalidRequest = tidcommon.ServiceError{
		Type: tidcommon.ClientErrorType,
		Code: "PRM-1001",
		Error: tidcommon.I18nMessage{
			Key:          "error.promoteservice.invalid_request",
			DefaultValue: "Invalid promotion request",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key:          "error.promoteservice.invalid_request_description",
			DefaultValue: "The provided promotion request is invalid or malformed",
		},
	}

	// ErrorSourceEmpty is returned when the source deployment holds nothing to promote. It is
	// distinct from a failed export: an empty source is a state a caller can act on, usually by
	// promoting from a different environment.
	ErrorSourceEmpty = tidcommon.ServiceError{
		Type: tidcommon.ClientErrorType,
		Code: "PRM-1002",
		Error: tidcommon.I18nMessage{
			Key:          "error.promoteservice.source_empty",
			DefaultValue: "Nothing to promote",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key:          "error.promoteservice.source_empty_description",
			DefaultValue: "The source deployment holds no configuration to promote",
		},
	}

	// ErrorUnpromotableType is returned when a named resource is of a type a promotion does not
	// carry, such as a user. It is distinct from an invalid request because the request is well
	// formed: what is wrong is the expectation of what a promotion moves.
	ErrorUnpromotableType = tidcommon.ServiceError{
		Type: tidcommon.ClientErrorType,
		Code: "PRM-1003",
		Error: tidcommon.I18nMessage{
			Key:          "error.promoteservice.unpromotable_type",
			DefaultValue: "Resource type cannot be promoted",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key:          "error.promoteservice.unpromotable_type_description",
			DefaultValue: "The named resource type is not carried by a promotion",
		},
	}
)
