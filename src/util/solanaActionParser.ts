/**
 * Parser functions for Solana Action Blinks
 *
 * These utilities handle the parsing and validation of Solana Action data
 * from API responses to ensure they conform to our expected type structure.
 */

import type {
  SolanaActionBlink,
  BlinkAction,
  ActionParameter,
  ParameterOption,
} from "../types/blinks";

// Parser function that handles all possible structures
export function parseSolanaActionBlink(json: any, url: string) {
  // Validate required fields
  if (!json.icon || !json.title || typeof json.description === "undefined") {
    throw new Error(
      "Invalid Solana Action Blink: missing required fields (icon, title, description)"
    );
  }

  // Parse the base structure
  const parsedBlink: SolanaActionBlink = {
    url: url,
    icon: json.icon,
    title: json.title,
    description: json.description || "",
  };

  // Add optional fields
  if (json.type === "action") {
    parsedBlink.type = json.type;
  }

  if (typeof json.label !== "undefined") {
    parsedBlink.label = json.label;
  }

  if (typeof json.disabled === "boolean") {
    parsedBlink.disabled = json.disabled;
  }

  // Parse links and actions
  if (json.links && json.links.actions && Array.isArray(json.links.actions)) {
    parsedBlink.links = {
      actions: json.links.actions.map(parseAction),
    };
  }

  return parsedBlink;
}

export function parseAction(action: any) {
  if (!action.label || !action.href) {
    throw new Error("Invalid action: missing required fields (label, href)");
  }

  const parsedAction: BlinkAction = {
    label: action.label,
    href: action.href,
  };

  // Add optional type
  if (action.type === "transaction" || action.type === "post") {
    parsedAction.type = action.type;
  }

  // Add other optional fields
  if (typeof action.disabled === "boolean") {
    parsedAction.disabled = action.disabled;
  }

  if (action.icon) {
    parsedAction.icon = action.icon;
  }

  if (action.color) {
    parsedAction.color = action.color;
  }

  if (action.description) {
    parsedAction.description = action.description;
  }

  // Parse parameters if they exist
  if (action.parameters && Array.isArray(action.parameters)) {
    parsedAction.parameters = action.parameters.map(parseParameter);
  }

  return parsedAction;
}

export function parseParameter(param: any) {
  console.log(JSON.stringify(param));
  if (!param.name) {
    throw new Error("Invalid parameter: missing required fields (name)");
  }

  const parsedParam: ActionParameter = {
    type: param?.type,
    name: param.name,
  };

  // Add optional fields
  if (typeof param.label !== "undefined") {
    parsedParam.label = param.label;
  }

  if (typeof param.required === "boolean") {
    parsedParam.required = param.required;
  }

  if (typeof param.value !== "undefined") {
    parsedParam.value = param.value;
  }

  if (typeof param.placeholder !== "undefined") {
    parsedParam.placeholder = param.placeholder;
  }

  // Parse options for select and radio types
  if (
    (param.type === "select" || param.type === "radio") &&
    param.options &&
    Array.isArray(param.options)
  ) {
    parsedParam.options = param.options.map(parseOption);
  }

  return parsedParam;
}

export function parseOption(option: any) {
  if (!option.label || !option.value) {
    throw new Error("Invalid option: missing required fields (label, value)");
  }

  const parsedOption: ParameterOption = {
    label: option.label,
    value: option.value,
  };

  if (typeof option.selected === "boolean") {
    parsedOption.selected = option.selected;
  }

  return parsedOption;
}

// Helper function to validate if an object is a valid Solana Action Blink
export function isValidSolanaActionBlink(obj: any): obj is SolanaActionBlink {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.icon === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    (!obj.type || obj.type === "action") &&
    (!obj.label || typeof obj.label === "string") &&
    (!obj.disabled || typeof obj.disabled === "boolean") &&
    (!obj.links ||
      (typeof obj.links === "object" &&
        Array.isArray(obj.links.actions) &&
        obj.links.actions.every(
          (action: any) =>
            typeof action.label === "string" && typeof action.href === "string"
        )))
  );
}

// Batch parser for multiple blinks
export function parseSolanaActionBlinks(jsonArray: any[], url: string[]) {
  return jsonArray.map((json, index) =>
    parseSolanaActionBlink(json, url[index])
  );
}

// Create a proxy URL for fetching from origins that might have CORS issues
export function createProxyUrl(url: string) {
  try {
    const httpsUrl = url.startsWith("https://") ? url : `https://${url}`;
    const encodedUrl = encodeURIComponent(httpsUrl);
    return `https://proxy.dial.to/?url=${encodedUrl}`;
  } catch (error) {
    console.error("Error creating proxy URL:", error);
    return url;
  }
}

export function createActionUrl(url: string, action: string): string {
  return url + (action || "");
}
