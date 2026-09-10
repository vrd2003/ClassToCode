// @ts-nocheck

export const REL_TYPES = [
  { key: "inheritance", label: "Inheritance", hint: "is-a / extends", color: "#6ea8fe", dash: false, endArrow: "triangle" },
  { key: "implementation", label: "Implementation", hint: "implements", color: "#b892f0", dash: true, endArrow: "triangle" },
  { key: "composition", label: "Composition", hint: "owns (part dies with whole)", color: "#f0708a", dash: false, startDiamond: "filled" },
  { key: "aggregation", label: "Aggregation", hint: "has-a (part can outlive whole)", color: "#e8a33d", dash: false, startDiamond: "hollow" },
  { key: "association", label: "Association", hint: "uses / refers to", color: "#5fd3bc", dash: false, endArrow: "open" },
  { key: "dependency", label: "Dependency", hint: "depends on", color: "#8b93a8", dash: true, endArrow: "open" },
];

export const VIS_OPTIONS = [
  { sym: "+", label: "public" },
  { sym: "-", label: "private" },
  { sym: "#", label: "protected" },
  { sym: "~", label: "package" },
];

export const KIND_OPTIONS = [
  { key: "class", label: "Class" },
  { key: "abstract", label: "Abstract" },
  { key: "interface", label: "Interface" },
];

export const LANGUAGE_OPTIONS = [
  { key: "java", label: "Java", extension: "java", mime: "text/x-java-source" },
  { key: "javascript", label: "JavaScript", extension: "js", mime: "text/javascript" },
  { key: "typescript", label: "TypeScript", extension: "ts", mime: "text/typescript" },
  { key: "python", label: "Python", extension: "py", mime: "text/x-python" },
  { key: "csharp", label: "C#", extension: "cs", mime: "text/plain" },
];

export const relDef = (key) => REL_TYPES.find((relationship) => relationship.key === key);
export const visWord = (symbol) => ({ "+": "public", "-": "private", "#": "protected", "~": "" }[symbol] ?? "");

let idCounter = 0;
export const uid = (prefix = "item") => `${prefix}_${(idCounter++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function field(id, name, type, visibility = "-") {
  return { id, name, type, visibility };
}

function method(id, name, returnType = "void", visibility = "+") {
  return { id, name, returnType, visibility, paramsText: "" };
}

export function seedState() {
  const vehicle = {
    id: uid("cls"), name: "Vehicle", kind: "abstract", x: 90, y: 90,
    fields: [field(uid("f"), "brand", "String"), field(uid("f"), "topSpeed", "int")],
    methods: [method(uid("m"), "accelerate"), method(uid("m"), "brake")],
  };
  const engine = {
    id: uid("cls"), name: "Engine", kind: "class", x: 640, y: 380,
    fields: [field(uid("f"), "horsepower", "int")],
    methods: [method(uid("m"), "start")],
  };
  const drivable = {
    id: uid("cls"), name: "Drivable", kind: "interface", x: 90, y: 400,
    fields: [], methods: [method(uid("m"), "drive")],
  };
  const car = {
    id: uid("cls"), name: "Car", kind: "class", x: 400, y: 100,
    fields: [field(uid("f"), "numDoors", "int")],
    methods: [method(uid("m"), "honk")],
  };

  return {
    classes: [vehicle, engine, drivable, car],
    relationships: [
      { id: uid("rel"), from: car.id, to: vehicle.id, type: "inheritance" },
      { id: uid("rel"), from: car.id, to: drivable.id, type: "implementation" },
      { id: uid("rel"), from: car.id, to: engine.id, type: "composition" },
    ],
  };
}

export function parseParams(text) {
  if (!text || !text.trim()) return [];

  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, type] = part.split(":").map((value) => (value || "").trim());
      return { name: name || "arg", type: type || "Object" };
    });
}

export function isValidJavaIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test((name || "").trim());
}

function defaultValueFor(type) {
  const defaults = {
    int: "0", short: "0", byte: "0", long: "0L", float: "0f",
    double: "0.0", boolean: "false", char: "'\\u0000'",
  };
  return defaults[(type || "").trim()] || "null";
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function getRelationshipFields(cls, relationships, classes) {
  const classesById = Object.fromEntries(classes.map((item) => [item.id, item]));
  const outgoing = relationships.filter((relationship) => relationship.from === cls.id);
  const fields = [];

  const addFieldFor = (relationship, fieldType, fieldName, initializer) => {
    const target = classesById[relationship.to];
    if (target) fields.push({ name: fieldName(target), type: fieldType(target), init: initializer?.(target) || null });
  };

  outgoing.filter((relationship) => relationship.type === "composition").forEach((relationship) => {
    addFieldFor(relationship, (target) => target.name, (target) => lowerFirst(target.name), (target) => `new ${target.name}()`);
  });
  outgoing.filter((relationship) => relationship.type === "aggregation").forEach((relationship) => {
    addFieldFor(relationship, (target) => `List<${target.name}>`, (target) => `${lowerFirst(target.name)}List`, () => "new ArrayList<>()");
  });
  outgoing.filter((relationship) => relationship.type === "association").forEach((relationship) => {
    addFieldFor(relationship, (target) => target.name, (target) => lowerFirst(target.name), () => null);
  });

  return fields;
}

function buildHeader(cls, classes, relationships) {
  const classesById = Object.fromEntries(classes.map((item) => [item.id, item]));
  const outgoing = relationships.filter((relationship) => relationship.from === cls.id);
  const parent = outgoing.find((relationship) => relationship.type === "inheritance");
  const interfaces = outgoing
    .filter((relationship) => relationship.type === "implementation")
    .map((relationship) => classesById[relationship.to]?.name)
    .filter(Boolean);

  let header = cls.kind === "interface"
    ? `public interface ${cls.name || "Unnamed"}`
    : `public ${cls.kind === "abstract" ? "abstract " : ""}class ${cls.name || "Unnamed"}`;

  if (parent && classesById[parent.to]) header += ` extends ${classesById[parent.to].name}`;
  if (interfaces.length) header += ` implements ${interfaces.join(", ")}`;
  return header;
}

function buildFields(cls, relationshipFields) {
  const ownFields = cls.fields
    .filter((field) => field.name)
    .map((field) => ({ name: field.name, type: field.type || "Object", vis: field.visibility, init: null }));
  return [...ownFields, ...relationshipFields.map((field) => ({ ...field, vis: "-" }))];
}

function appendFieldCode(lines, fields) {
  fields.forEach((field) => {
    const visibility = visWord(field.vis);
    const prefix = visibility ? `${visibility} ` : "";
    const initializer = field.init ? ` = ${field.init}` : "";
    lines.push(`    ${prefix}${field.type} ${field.name}${initializer};`);
  });

  if (fields.length) lines.push("");
}

function appendAccessorCode(lines, fields) {
  fields.forEach((field) => {
    const name = capitalize(field.name);
    const getter = field.type === "boolean" ? `is${name}` : `get${name}`;
    lines.push(`    public ${field.type} ${getter}() {`);
    lines.push(`        return this.${field.name};`);
    lines.push("    }");
    lines.push("");
    lines.push(`    public void set${name}(${field.type} ${field.name}) {`);
    lines.push(`        this.${field.name} = ${field.name};`);
    lines.push("    }");
    lines.push("");
  });
}

function appendMethodCode(lines, cls) {
  cls.methods.filter((item) => item.name).forEach((method) => {
    const params = parseParams(method.paramsText)
      .map((param) => `${param.type} ${param.name}`)
      .join(", ");
    const returnType = method.returnType || "void";

    if (cls.kind === "interface") {
      lines.push(`    ${returnType} ${method.name}(${params});`);
    } else {
      const visibility = visWord(method.visibility);
      const prefix = visibility ? `${visibility} ` : "";
      lines.push(`    ${prefix}${returnType} ${method.name}(${params}) {`);
      lines.push("        // TODO: implement");
      if (returnType !== "void") lines.push(`        return ${defaultValueFor(returnType)};`);
      lines.push("    }");
    }
    lines.push("");
  });
}

export function generateClassCode(cls, classes, relationships) {
  const fieldsFromRelationships = getRelationshipFields(cls, relationships, classes);
  const imports = fieldsFromRelationships.some((field) => field.type.startsWith("List<"))
    ? ["import java.util.ArrayList;", "import java.util.List;"]
    : [];
  const lines = [`${buildHeader(cls, classes, relationships)} {`];

  if (cls.kind !== "interface") {
    const fields = buildFields(cls, fieldsFromRelationships);
    appendFieldCode(lines, fields);
    lines.push(`    public ${cls.name || "Unnamed"}() {`);
    fieldsFromRelationships.filter((field) => field.init).forEach((field) => {
      lines.push(`        this.${field.name} = ${field.init};`);
    });
    lines.push("    }");
    lines.push("");
    appendAccessorCode(lines, fields);
  }

  appendMethodCode(lines, cls);
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  lines.push("}");
  return imports.length ? `${imports.join("\n")}\n\n${lines.join("\n")}` : lines.join("\n");
}

function languageHeader(cls, classes, relationships, language) {
  const classById = Object.fromEntries(classes.map((item) => [item.id, item]));
  const outgoing = relationships.filter((relationship) => relationship.from === cls.id);
  const parent = outgoing.find((relationship) => relationship.type === "inheritance");
  const parentName = parent ? classById[parent.to]?.name : null;
  const baseName = cls.name || "Unnamed";

  if (language === "python") return `class ${baseName}(${parentName || "object"}):`;
  if (language === "csharp") return `public class ${baseName}${parentName ? ` : ${parentName}` : ""}`;
  if (language === "typescript") return `export class ${baseName}${parentName ? ` extends ${parentName}` : ""} {`;
  return `export class ${baseName}${parentName ? ` extends ${parentName}` : ""} {`;
}

function languageType(type, language) {
  const value = type || "Object";
  if (language === "typescript") {
    return { int: "number", long: "number", float: "number", double: "number", boolean: "boolean", String: "string", void: "void" }[value] || value;
  }
  if (language === "python") return { int: "int", long: "int", float: "float", double: "float", boolean: "bool", String: "str", void: "None" }[value] || "object";
  if (language === "javascript") return "";
  return value;
}

function generateJavaScriptClass(cls, classes, relationships, language) {
  const fields = cls.fields.filter((field) => field.name);
  const methods = cls.methods.filter((method) => method.name);
  const lines = [languageHeader(cls, classes, relationships, language)];

  if (language === "python") {
    lines.push("    def __init__(self):");
    if (fields.length) fields.forEach((field) => lines.push(`        self.${field.name} = None`));
    else lines.push("        pass");
    methods.forEach((method) => {
      const params = parseParams(method.paramsText).map((param) => `${param.name}`).join(", ");
      lines.push("", `    def ${method.name}(self${params ? `, ${params}` : ""}):`, "        pass");
    });
    return lines.join("\n");
  }

  if (language === "csharp") {
    fields.forEach((field) => lines.push(`    private ${languageType(field.type, language)} ${field.name};`));
    lines.push("", `    public ${cls.name || "Unnamed"}()`, "    {");
    lines.push("    }");
    methods.forEach((method) => {
      const params = parseParams(method.paramsText).map((param) => `${languageType(param.type, language)} ${param.name}`).join(", ");
      lines.push("", `    public ${languageType(method.returnType, language)} ${method.name}(${params})`, "    {", "        // TODO: implement", "    }");
    });
    lines.push("}");
    return lines.join("\n");
  }

  fields.forEach((field) => {
    const type = languageType(field.type, language);
    lines.push(language === "typescript" ? `    ${field.name}: ${type};` : `    ${field.name};`);
  });
  lines.push("", "    constructor() {");
  fields.forEach((field) => lines.push(`        this.${field.name} = null;`));
  lines.push("    }");
  methods.forEach((method) => {
    const params = parseParams(method.paramsText).map((param) => language === "typescript" ? `${param.name}: ${languageType(param.type, language)}` : param.name).join(", ");
    const returnType = language === "typescript" ? `: ${languageType(method.returnType, language)}` : "";
    lines.push("", `    ${method.name}(${params})${returnType} {`, "        // TODO: implement", "    }");
  });
  lines.push("}");
  return lines.join("\n");
}

export function generateClassCodeForLanguage(cls, classes, relationships, language) {
  if (language === "java") return generateClassCode(cls, classes, relationships);
  return generateJavaScriptClass(cls, classes, relationships, language);
}
