// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

var (
	// ErrorDataPlaneUnreachable is returned when a value could not be placed or read because the
	// data plane did not answer. The operation that needed it fails: a resource stored without its
	// value placed would refer to something that does not exist.
	ErrorDataPlaneUnreachable = tidcommon.ServiceError{
		Type: tidcommon.ServerErrorType,
		Code: "DPV-5001",
		Error: tidcommon.I18nMessage{
			Key:          "error.dataplane.unreachable",
			DefaultValue: "The data plane could not be reached",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key: "error.dataplane.unreachable.description",
			DefaultValue: "The values this resource refers to are held by the data plane this " +
				"control plane administers, and it did not answer. Try again once it is reachable.",
		},
	}
	// ErrorDataPlaneRefusedTheToken is returned when the data plane rejects the registered key.
	// Retrying cannot fix it, so it is reported apart from a data plane that is merely down.
	ErrorDataPlaneRefusedTheToken = tidcommon.ServiceError{
		Type: tidcommon.ServerErrorType,
		Code: "DPV-5002",
		Error: tidcommon.I18nMessage{
			Key:          "error.dataplane.token_refused",
			DefaultValue: "The data plane refused this control plane's credential",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key: "error.dataplane.token_refused.description",
			DefaultValue: "Rotate the gateway's key and give the new one to the data plane, which " +
				"holds it as its management API key.",
		},
	}
	// ErrorDataPlaneUnusable is returned when the registration cannot be turned into a usable
	// client at all, such as an address that names no host.
	ErrorDataPlaneUnusable = tidcommon.ServiceError{
		Type: tidcommon.ServerErrorType,
		Code: "DPV-5003",
		Error: tidcommon.I18nMessage{
			Key:          "error.dataplane.unusable_registration",
			DefaultValue: "The data plane's registration cannot be used",
		},
		ErrorDescription: tidcommon.I18nMessage{
			Key: "error.dataplane.unusable_registration.description",
			DefaultValue: "Check the registered address and certificate of the gateway this " +
				"control plane administers.",
		},
	}
)
