// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Download, Copy, Check, Boxes, ChevronRight, Info } from "./icons";
import {
  REL_TYPES,
  relDef,
  KIND_OPTIONS,
  VIS_OPTIONS,
  LANGUAGE_OPTIONS,
  visWord,
  uid,
  seedState as createInitialModel,
  parseParams,
  isValidJavaIdentifier as validateJavaIdentifier,
  generateClassCodeForLanguage,
} from "./umlModel";
import { T, btnStyle } from "./umlTheme";

const BOX_W = 236;
const CANVAS_W = 2600;
const CANVAS_H = 1500;
const ROW_H = 20;

/* ----------------------------- geometry ---------------------------------- */
function getBoxHeight(cls) {
  let h = 46;
  if (cls.kind !== "class") h += 18;
  if (cls.kind !== "interface") h += 12 + Math.max(cls.fields.length, 1) * ROW_H;
  h += 12 + Math.max(cls.methods.length, 1) * ROW_H;
  return h + 10;
}
function edgePoint(box, otherCx, otherCy) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const dx = otherCx - cx, dy = otherCy - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = box.w / 2, halfH = box.h / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function diagramSvg(classes, relationships) {
  const boxes = {};
  classes.forEach((cls) => { boxes[cls.id] = { x: cls.x, y: cls.y, w: BOX_W, h: getBoxHeight(cls) }; });
  const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = relationships.map((relationship) => {
    const from = boxes[relationship.from];
    const to = boxes[relationship.to];
    if (!from || !to) return "";
    const def = relDef(relationship.type);
    const start = edgePoint(from, to.x + to.w / 2, to.y + to.h / 2);
    const end = edgePoint(to, from.x + from.w / 2, from.y + from.h / 2);
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${def.color}" stroke-width="2" ${def.dash ? 'stroke-dasharray="7 5"' : ""}/>`;
  }).join("");
  const nodes = classes.map((cls) => {
    const box = boxes[cls.id];
    const members = cls.kind === "interface" ? [] : cls.fields.map((field) => `${field.visibility} ${field.name || "field"}: ${field.type || "Object"}`);
    const methods = cls.methods.map((method) => `${method.visibility} ${method.name || "method"}(): ${method.returnType || "void"}`);
    const text = [`${cls.kind === "interface" ? "<<interface>> " : ""}${cls.name || "(unnamed)"}`, ...members, ...methods];
    return `<g><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="8" fill="#171c28" stroke="#e8a33d"/><line x1="${box.x}" y1="${box.y + 46}" x2="${box.x + box.w}" y2="${box.y + 46}" stroke="#242b3d"/>${text.map((row, index) => `<text x="${box.x + box.w / 2}" y="${box.y + 28 + index * ROW_H}" text-anchor="middle" fill="#e5e8f0" font-family="monospace" font-size="${index === 0 ? 13 : 11}">${esc(row)}</text>`).join("")}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}"><rect width="100%" height="100%" fill="#0b0e14"/>${lines}${nodes}</svg>`;
}

/* ------------------------------------------------------------------------ */

export default function App() {
  const seeded = useMemo(createInitialModel, []);
  const [classes, setClasses] = useState(seeded.classes);
  const [relationships, setRelationships] = useState(seeded.relationships);
  const [selectedId, setSelectedId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [connectType, setConnectType] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeTab, setCodeTab] = useState("all");
  const [codeLanguage, setCodeLanguage] = useState("java");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  const canvasRef = useRef(null);
  const dragRef = useRef(null); // {id, offsetX, offsetY, moved}

  const boxes = useMemo(() => {
    const m = {};
    classes.forEach((c) => { m[c.id] = { x: c.x, y: c.y, w: BOX_W, h: getBoxHeight(c) }; });
    return m;
  }, [classes]);

  const flashToast = (msg) => { setToast(msg); window.clearTimeout(flashToast._t); flashToast._t = window.setTimeout(() => setToast(null), 2200); };

  /* ------------------------------ dragging ------------------------------ */
  const onBoxMouseDown = (e, id) => {
    if (e.button !== 0) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const cls = classes.find((c) => c.id === id);
    const startX = e.clientX + canvasRef.current.scrollLeft - canvasRect.left;
    const startY = e.clientY + canvasRef.current.scrollTop - canvasRect.top;
    dragRef.current = { id, offsetX: startX - cls.x, offsetY: startY - cls.y, moved: false };
    e.stopPropagation();
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX + canvasRef.current.scrollLeft - canvasRect.left;
      const py = e.clientY + canvasRef.current.scrollTop - canvasRect.top;
      let nx = px - d.offsetX, ny = py - d.offsetY;
      nx = Math.max(0, Math.min(CANVAS_W - BOX_W, nx));
      ny = Math.max(0, Math.min(CANVAS_H - 60, ny));
      d.moved = true;
      setClasses((prev) => prev.map((c) => (c.id === d.id ? { ...c, x: nx, y: ny } : c)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  /* ----------------------------- connecting ------------------------------ */
  const armConnect = (typeKey) => {
    if (connectType === typeKey) { setConnectType(null); setConnectFrom(null); return; }
    setConnectType(typeKey); setConnectFrom(null);
  };

  const onBoxClick = (id) => {
    if (dragRef.current?.moved) return; // was a drag, not a click
    if (connectType) {
      if (!connectFrom) { setConnectFrom(id); return; }
      if (connectFrom === id) { setConnectFrom(null); return; }
      const exists = relationships.some((r) => r.from === connectFrom && r.to === id && r.type === connectType);
      if (exists) { flashToast("That relationship already exists."); setConnectType(null); setConnectFrom(null); return; }
      setRelationships((prev) => [...prev, { id: uid("rel"), from: connectFrom, to: id, type: connectType }]);
      flashToast(`${relDef(connectType).label} added.`);
      setConnectType(null); setConnectFrom(null);
      return;
    }
    setSelectedId(id);
  };

  const openContextMenu = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(id);
    setContextMenu({ id, x: event.clientX, y: event.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);
  const editFromContextMenu = () => {
    setEditorOpen(true);
    closeContextMenu();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setConnectType(null);
      setConnectFrom(null);
      closeContextMenu();
      setEditorOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------- CRUD ---------------------------------- */
  const addClass = () => {
    const n = classes.length;
    const nc = {
      id: uid("cls"), name: `NewClass${n + 1}`, kind: "class",
      x: 120 + (n % 5) * 60, y: 120 + (n % 5) * 50,
      fields: [{ id: uid("f"), name: "id", type: "int", visibility: "-" }],
      methods: [{ id: uid("m"), name: "doSomething", returnType: "void", visibility: "+", paramsText: "" }],
    };
    setClasses((prev) => [...prev, nc]);
    setSelectedId(nc.id);
  };
  const updateClass = (id, patch) => setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const deleteClass = (id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setRelationships((prev) => prev.filter((r) => r.from !== id && r.to !== id));
    if (selectedId === id) setSelectedId(null);
    if (contextMenu?.id === id) closeContextMenu();
    setEditorOpen(false);
  };

  const addField = (clsId) => updateClass(clsId, { fields: [...classes.find((c) => c.id === clsId).fields, { id: uid("f"), name: "field", type: "String", visibility: "-" }] });
  const updateField = (clsId, fieldId, patch) => updateClass(clsId, { fields: classes.find((c) => c.id === clsId).fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) });
  const deleteField = (clsId, fieldId) => updateClass(clsId, { fields: classes.find((c) => c.id === clsId).fields.filter((f) => f.id !== fieldId) });

  const addMethod = (clsId) => updateClass(clsId, { methods: [...classes.find((c) => c.id === clsId).methods, { id: uid("m"), name: "method", returnType: "void", visibility: "+", paramsText: "" }] });
  const updateMethod = (clsId, methodId, patch) => updateClass(clsId, { methods: classes.find((c) => c.id === clsId).methods.map((m) => (m.id === methodId ? { ...m, ...patch } : m)) });
  const deleteMethod = (clsId, methodId) => updateClass(clsId, { methods: classes.find((c) => c.id === clsId).methods.filter((m) => m.id !== methodId) });

  const deleteRelationship = (relId) => setRelationships((prev) => prev.filter((r) => r.id !== relId));

  /* ------------------------------- code ----------------------------------- */
  const nameIssues = useMemo(() => {
    const issues = [];
    const seen = new Map();
    classes.forEach((c) => {
      if (!c.name || !validateJavaIdentifier(c.name)) issues.push(`"${c.name || "(unnamed)"}" isn't a valid Java class name.`);
      const key = (c.name || "").toLowerCase();
      if (key) seen.set(key, (seen.get(key) || 0) + 1);
    });
    seen.forEach((count, key) => { if (count > 1) issues.push(`Two or more classes are named "${key}" — Java needs unique names.`); });
    return issues;
  }, [classes]);

  const generatedByClass = useMemo(() => {
    const map = {};
    classes.forEach((c) => { map[c.id] = generateClassCodeForLanguage(c, classes, relationships, codeLanguage); });
    return map;
  }, [classes, relationships, codeLanguage]);

  const allCode = useMemo(() => classes.map((c) => generatedByClass[c.id]).join("\n\n"), [classes, generatedByClass]);

  const openCode = () => { setCodeOpen(true); setCodeTab(classes[0]?.id || "all"); };

  const copyCurrent = async () => {
    const text = codeTab === "all" ? allCode : generatedByClass[codeTab] || "";
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { flashToast("Couldn't copy — select and copy manually."); }
  };
  const downloadCurrent = () => {
    const isAll = codeTab === "all";
    const cls = classes.find((c) => c.id === codeTab);
    const language = LANGUAGE_OPTIONS.find((item) => item.key === codeLanguage);
    const filename = isAll ? `AllClasses.${language.extension}` : `${cls?.name || "Unnamed"}.${language.extension}`;
    const text = isAll ? allCode : generatedByClass[codeTab] || "";
    downloadText(filename, text, language.mime);
  };
  const downloadAllSeparately = () => {
    const language = LANGUAGE_OPTIONS.find((item) => item.key === codeLanguage);
    classes.forEach((c, i) => {
      window.setTimeout(() => {
        downloadText(`${c.name || "Unnamed"}.${language.extension}`, generatedByClass[c.id], language.mime);
      }, i * 150);
    });
  };
  const downloadDiagram = () => downloadText("uml-class-diagram.svg", diagramSvg(classes, relationships), "image/svg+xml");

  const selected = classes.find((c) => c.id === selectedId) || null;
  const selectedRels = selected ? relationships.filter((r) => r.from === selected.id || r.to === selected.id) : [];

  return (
    <div style={{ fontFamily: T.sans, background: T.bg, color: T.text, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <GlobalStyle />
      <Toolbar
        connectType={connectType}
        connectFrom={connectFrom}
        onAddClass={addClass}
        onArmConnect={armConnect}
        onOpenCode={openCode}
        onDownloadDiagram={downloadDiagram}
        classCount={classes.length}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div
          ref={canvasRef}
          onClick={() => { if (!connectType) { setSelectedId(null); closeContextMenu(); } }}
          onContextMenu={(event) => { event.preventDefault(); closeContextMenu(); }}
          style={{
            flex: 1, position: "relative", overflow: "auto",
            background: `radial-gradient(circle, ${T.bgDot} 1.2px, transparent 1.2px) 0 0/22px 22px, ${T.bg}`,
            cursor: connectType ? "crosshair" : "default",
          }}
        >
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>
            <svg width={CANVAS_W} height={CANVAS_H} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
              <defs>
                {REL_TYPES.map((r) => (
                  <React.Fragment key={r.key}>
                    <marker id={`arrow-triangle-${r.key}`} markerWidth="14" markerHeight="12" refX="13" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,0 L14,6 L0,12 Z" fill={T.bg} stroke={r.color} strokeWidth="1.5" strokeLinejoin="round" />
                    </marker>
                    <marker id={`arrow-open-${r.key}`} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,0 L10,6 L0,12" fill="none" stroke={r.color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                    </marker>
                    <marker id={`diamond-filled-${r.key}`} markerWidth="18" markerHeight="12" refX="17" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,6 L9,1 L18,6 L9,11 Z" fill={r.color} stroke={r.color} strokeWidth="1" />
                    </marker>
                    <marker id={`diamond-hollow-${r.key}`} markerWidth="18" markerHeight="12" refX="17" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                      <path d="M0,6 L9,1 L18,6 L9,11 Z" fill={T.bg} stroke={r.color} strokeWidth="1.5" />
                    </marker>
                  </React.Fragment>
                ))}
              </defs>
              {relationships.map((r) => {
                const a = boxes[r.from], b = boxes[r.to];
                if (!a || !b) return null;
                const def = relDef(r.type);
                const acx = a.x + a.w / 2, acy = a.y + a.h / 2;
                const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
                const p1 = edgePoint(a, bcx, bcy);
                const p2 = edgePoint(b, acx, acy);
                let markerStart, markerEnd;
                if (def.startDiamond === "filled") markerStart = `url(#diamond-filled-${def.key})`;
                if (def.startDiamond === "hollow") markerStart = `url(#diamond-hollow-${def.key})`;
                if (def.endArrow === "triangle") markerEnd = `url(#arrow-triangle-${def.key})`;
                if (def.endArrow === "open") markerEnd = `url(#arrow-open-${def.key})`;
                return (
                  <g key={r.id} style={{ pointerEvents: "auto" }}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth="14"
                      onClick={(e) => { e.stopPropagation(); deleteRelationship(r.id); flashToast("Relationship removed."); }}
                      style={{ cursor: "pointer" }} />
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={def.color} strokeWidth="1.8"
                      strokeDasharray={def.dash ? "7,5" : undefined} markerStart={markerStart} markerEnd={markerEnd} />
                  </g>
                );
              })}
            </svg>

            {classes.map((c) => (
              <ClassBox
                key={c.id}
                cls={c}
                box={boxes[c.id]}
                selected={selectedId === c.id}
                connectArmed={!!connectType}
                connectFromThis={connectFrom === c.id}
                hovered={hoverId === c.id}
                onMouseEnter={() => setHoverId(c.id)}
                onMouseLeave={() => setHoverId(null)}
                onMouseDown={(e) => onBoxMouseDown(e, c.id)}
                onContextMenu={(e) => openContextMenu(e, c.id)}
                onClick={(e) => { e.stopPropagation(); onBoxClick(c.id); }}
              />
            ))}

            {classes.length === 0 && (
              <div style={{ position: "absolute", top: 140, left: 140, color: T.textFaint, maxWidth: 360 }}>
                <div style={{ fontSize: 15, marginBottom: 6, color: T.textDim }}>The canvas is empty.</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Add a class to start sketching your architecture. Drag it anywhere, define its fields and methods, then wire it up to other classes.</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={editFromContextMenu}
          onDelete={() => deleteClass(contextMenu.id)}
          onClose={closeContextMenu}
        />
      )}

      {editorOpen && selected && (
        <Inspector
          modal
          cls={selected}
          rels={selectedRels}
          classes={classes}
          onUpdateClass={updateClass}
          onDeleteClass={deleteClass}
          onAddField={addField}
          onUpdateField={updateField}
          onDeleteField={deleteField}
          onAddMethod={addMethod}
          onUpdateMethod={updateMethod}
          onDeleteMethod={deleteMethod}
          onDeleteRel={deleteRelationship}
          onClose={() => { setEditorOpen(false); setSelectedId(null); }}
        />
      )}

      {connectType && (
        <div style={{
          position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
          background: T.panel3, border: `1px solid ${relDef(connectType).color}55`, borderRadius: 9,
          padding: "9px 16px", fontSize: 12.5, color: T.text, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)", zIndex: 30,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: relDef(connectType).color, display: "inline-block" }} />
          {!connectFrom
            ? <>Click the <b>source</b> class for a {relDef(connectType).label.toLowerCase()} relationship.</>
            : <>Now click the <b>target</b> class. <span style={{ color: T.textDim }}>(Esc to cancel)</span></>}
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", top: 66, left: "50%", transform: "translateX(-50%)", background: T.panel3, border: `1px solid ${T.border}`, color: T.text, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}

      {codeOpen && (
        <CodeDrawer
          classes={classes}
          codeTab={codeTab}
          setCodeTab={setCodeTab}
          allCode={allCode}
          generatedByClass={generatedByClass}
          language={codeLanguage}
          languageOptions={LANGUAGE_OPTIONS}
          onLanguageChange={setCodeLanguage}
          onClose={() => setCodeOpen(false)}
          onCopy={copyCurrent}
          copied={copied}
          onDownload={downloadCurrent}
          onDownloadAll={downloadAllSeparately}
          nameIssues={nameIssues}
        />
      )}
    </div>
  );
}

/* ------------------------------- Toolbar --------------------------------- */
function Toolbar({ connectType, connectFrom, onAddClass, onArmConnect, onOpenCode, onDownloadDiagram, classCount }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 18px", background: T.panel, borderBottom: `1px solid ${T.border}`, flexShrink: 0, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 16, borderRight: `1px solid ${T.border}` }}>
        <Boxes size={17} color={T.amber} />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>UML → Java</span>
        <span style={{ fontSize: 11.5, color: T.textFaint, fontFamily: T.mono }}>{classCount} class{classCount === 1 ? "" : "es"}</span>
      </div>

      <button onClick={onAddClass} style={btnStyle(true)}>
        <Plus size={14} /> Add class
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, color: T.textFaint, marginRight: 2 }}>Relationship:</span>
        {REL_TYPES.map((r) => {
          const active = connectType === r.key;
          return (
            <button
              key={r.key}
              title={r.hint}
              onClick={() => onArmConnect(r.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 10px", borderRadius: 7,
                border: `1px solid ${active ? r.color : T.border}`, background: active ? `${r.color}22` : "transparent",
                color: active ? T.text : T.textDim, cursor: "pointer", fontFamily: T.sans, transition: "all .12s",
              }}
            >
              <RelIcon type={r.key} color={r.color} />
              {r.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginLeft: "auto" }}>
        <button onClick={onDownloadDiagram} style={btnStyle(false, T.textDim)} title="Download the UML diagram as SVG">
          <Download size={14} /> Export diagram
        </button>
        <button onClick={onOpenCode} style={btnStyle(false, T.amber)}>
          {"</>"} Generate Code
        </button>
      </div>
    </div>
  );
}

function RelIcon({ type, color }) {
  const def = relDef(type);
  return (
    <svg width="20" height="10" viewBox="0 0 20 10">
      <line x1="1" y1="5" x2="16" y2="5" stroke={color} strokeWidth="1.6" strokeDasharray={def.dash ? "3,2" : undefined} />
      {def.endArrow === "triangle" && <path d="M14,1 L19,5 L14,9 Z" fill={T.bg} stroke={color} strokeWidth="1.2" />}
      {def.endArrow === "open" && <path d="M13,1 L18,5 L13,9" fill="none" stroke={color} strokeWidth="1.3" />}
      {def.startDiamond === "filled" && <path d="M1,5 L5,2 L9,5 L5,8 Z" fill={color} />}
      {def.startDiamond === "hollow" && <path d="M1,5 L5,2 L9,5 L5,8 Z" fill={T.bg} stroke={color} strokeWidth="1.2" />}
    </svg>
  );
}

/* ------------------------------- ClassBox -------------------------------- */
function ClassBox({ cls, box, selected, connectArmed, connectFromThis, hovered, onMouseEnter, onMouseLeave, onMouseDown, onClick, onContextMenu }) {
  const stereotype = cls.kind === "interface" ? "«interface»" : cls.kind === "abstract" ? "«abstract»" : null;
  const borderColor = connectFromThis ? T.amber : selected ? T.amber : hovered && connectArmed ? "#6ea8fe" : T.border;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        position: "absolute", left: box.x, top: box.y, width: box.w,
        background: T.panel2, border: `1.5px solid ${borderColor}`, borderRadius: 8,
        boxShadow: selected ? `0 0 0 3px ${T.amberSoft}, 0 10px 26px rgba(0,0,0,0.4)` : "0 4px 14px rgba(0,0,0,0.35)",
        cursor: connectArmed ? "pointer" : "grab", userSelect: "none", fontFamily: T.mono, fontSize: 12,
        animation: connectFromThis ? "pulseBorder 1.1s ease-in-out infinite" : undefined,
      }}
    >
      <div style={{ padding: "9px 12px 8px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
        {stereotype && <div style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 2 }}>{stereotype}</div>}
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontStyle: cls.kind === "abstract" ? "italic" : "normal", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cls.name || "(unnamed)"}
        </div>
      </div>

      {cls.kind !== "interface" && (
        <div style={{ padding: "6px 12px", borderBottom: `1px solid ${T.borderSoft}`, minHeight: ROW_H }}>
          {cls.fields.length === 0 && <Row dim>— no fields —</Row>}
          {cls.fields.map((f) => (
            <Row key={f.id}>
              <span style={{ color: T.amber, marginRight: 5 }}>{f.visibility}</span>
              {f.name || "field"}<span style={{ color: T.textFaint }}>: {f.type || "Object"}</span>
            </Row>
          ))}
        </div>
      )}

      <div style={{ padding: "6px 12px", minHeight: ROW_H }}>
        {cls.methods.length === 0 && <Row dim>— no methods —</Row>}
        {cls.methods.map((m) => (
          <Row key={m.id}>
            <span style={{ color: T.amber, marginRight: 5 }}>{m.visibility}</span>
            {m.name || "method"}<span style={{ color: T.textFaint }}>({paramsSummary(m.paramsText)}): {m.returnType || "void"}</span>
          </Row>
        ))}
      </div>
    </div>
  );
}
function paramsSummary(text) {
  const params = parseParams(text);
  return params.map((p) => `${p.name}: ${p.type}`).join(", ");
}
function Row({ children, dim }) {
  return <div style={{ height: ROW_H, lineHeight: `${ROW_H}px`, color: dim ? T.textFaint : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: dim ? "italic" : "normal" }}>{children}</div>;
}

/* ------------------------------- Inspector -------------------------------- */
function ContextMenu({ x, y, onEdit, onDelete, onClose }) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      style={{ position: "fixed", left: x, top: y, zIndex: 60, minWidth: 170, padding: 5, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: "0 14px 32px rgba(0,0,0,0.5)" }}
    >
      <button onClick={onEdit} style={contextMenuButton}>Edit class</button>
      <button onClick={onDelete} style={{ ...contextMenuButton, color: T.danger }}>Delete class</button>
      <button onClick={onClose} style={contextMenuButton}>Cancel</button>
    </div>
  );
}

const contextMenuButton = {
  display: "block", width: "100%", padding: "8px 10px", border: "none", borderRadius: 5,
  background: "transparent", color: T.text, textAlign: "left", cursor: "pointer", fontFamily: T.sans, fontSize: 12,
};

function Inspector({ modal, cls, rels, classes, onUpdateClass, onDeleteClass, onAddField, onUpdateField, onDeleteField, onAddMethod, onUpdateMethod, onDeleteMethod, onDeleteRel, onClose }) {
  if (!cls) {
    return (
      <div style={{ width: 300, flexShrink: 0, background: T.panel, borderLeft: `1px solid ${T.border}`, padding: 20, color: T.textFaint, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, color: T.textDim }}>
          <Info size={14} /> No class selected
        </div>
        Click a class on the canvas to edit its name, fields, and methods here.
      </div>
    );
  }
  const byId = Object.fromEntries(classes.map((c) => [c.id, c]));

  return (
    <div onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} style={modal ? { position: "fixed", inset: 0, zIndex: 55, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(4,6,10,0.72)" } : undefined}>
      <div style={{ width: 420, maxWidth: "100%", maxHeight: "min(760px, 100%)", flexShrink: 0, background: T.panel, border: `1px solid ${T.border}`, borderRadius: modal ? 12 : 0, overflowY: "auto", display: "flex", flexDirection: "column", boxShadow: modal ? "0 30px 80px rgba(0,0,0,0.6)" : "none" }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textDim, letterSpacing: 0.4 }}>CLASS EDITOR</span>
        <button onClick={onClose} style={iconBtnStyle}><X size={14} /></button>
      </div>

      <div style={{ padding: 16, borderBottom: `1px solid ${T.borderSoft}` }}>
        <FieldLabel>Name</FieldLabel>
        <input value={cls.name} onChange={(e) => onUpdateClass(cls.id, { name: e.target.value.replace(/\s+/g, "") })} style={inputStyle(T.mono)} placeholder="ClassName" />

        <FieldLabel style={{ marginTop: 12 }}>Type</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {KIND_OPTIONS.map((k) => (
            <button key={k.key} onClick={() => onUpdateClass(cls.id, { kind: k.key })}
              style={{ flex: 1, fontSize: 11.5, padding: "6px 4px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${cls.kind === k.key ? T.amber : T.border}`, background: cls.kind === k.key ? T.amberSoft : "transparent",
                color: cls.kind === k.key ? T.text : T.textDim, fontFamily: T.sans }}>
              {k.label}
            </button>
          ))}
        </div>

        <button onClick={() => onDeleteClass(cls.id)} style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, padding: "7px 0", borderRadius: 7, border: `1px solid ${T.danger}55`, background: "transparent", color: T.danger, cursor: "pointer", fontFamily: T.sans }}>
          <Trash2 size={13} /> Delete class
        </button>
      </div>

      {cls.kind !== "interface" && (
        <Section title="Fields" onAdd={() => onAddField(cls.id)}>
          {cls.fields.map((f) => (
            <FieldRow key={f.id}>
              <VisSelect value={f.visibility} onChange={(v) => onUpdateField(cls.id, f.id, { visibility: v })} />
              <input value={f.name} onChange={(e) => onUpdateField(cls.id, f.id, { name: e.target.value.replace(/\s+/g, "") })} placeholder="name" style={smallInput(0.9)} />
              <input value={f.type} onChange={(e) => onUpdateField(cls.id, f.id, { type: e.target.value })} placeholder="Type" style={smallInput(0.8)} />
              <button onClick={() => onDeleteField(cls.id, f.id)} style={iconBtnStyle}><X size={12} /></button>
            </FieldRow>
          ))}
          {cls.fields.length === 0 && <EmptyHint>No fields yet.</EmptyHint>}
        </Section>
      )}

      <Section title="Methods" onAdd={() => onAddMethod(cls.id)}>
        {cls.methods.map((m) => (
          <div key={m.id} style={{ marginBottom: 10, padding: 8, background: T.panel2, borderRadius: 7, border: `1px solid ${T.borderSoft}` }}>
            <FieldRow style={{ marginBottom: 6 }}>
              <VisSelect value={m.visibility} onChange={(v) => onUpdateMethod(cls.id, m.id, { visibility: v })} />
              <input value={m.name} onChange={(e) => onUpdateMethod(cls.id, m.id, { name: e.target.value.replace(/\s+/g, "") })} placeholder="methodName" style={smallInput(1)} />
              <button onClick={() => onDeleteMethod(cls.id, m.id)} style={iconBtnStyle}><X size={12} /></button>
            </FieldRow>
            <FieldRow>
              <input value={m.paramsText} onChange={(e) => onUpdateMethod(cls.id, m.id, { paramsText: e.target.value })} placeholder="param: Type, ..." style={smallInput(1.3)} />
              <input value={m.returnType} onChange={(e) => onUpdateMethod(cls.id, m.id, { returnType: e.target.value })} placeholder="void" style={smallInput(0.7)} />
            </FieldRow>
          </div>
        ))}
        {cls.methods.length === 0 && <EmptyHint>No methods yet.</EmptyHint>}
      </Section>

      <Section title="Relationships" collapsedIfEmpty>
        {rels.length === 0 && <EmptyHint>None yet — use the toolbar to connect this class to another.</EmptyHint>}
        {rels.map((r) => {
          const def = relDef(r.type);
          const isSource = r.from === cls.id;
          const otherName = byId[isSource ? r.to : r.from]?.name || "?";
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, padding: "6px 8px", background: T.panel2, borderRadius: 6, marginBottom: 6, border: `1px solid ${T.borderSoft}` }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: def.color, flexShrink: 0 }} />
              <span style={{ color: T.textDim, flex: 1 }}>
                {isSource ? <>{def.label} <ChevronRight size={10} style={{ verticalAlign: "middle" }} /> <b style={{ color: T.text }}>{otherName}</b></> : <><b style={{ color: T.text }}>{otherName}</b> <ChevronRight size={10} style={{ verticalAlign: "middle" }} /> {def.label.toLowerCase()} of this</>}
              </span>
              <button onClick={() => onDeleteRel(r.id)} style={iconBtnStyle}><X size={12} /></button>
            </div>
          );
        })}
      </Section>
      </div>
    </div>
  );
}

function Section({ title, onAdd, children, collapsedIfEmpty }) {
  return (
    <div style={{ padding: 16, borderBottom: `1px solid ${T.borderSoft}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textDim, letterSpacing: 0.4 }}>{title.toUpperCase()}</span>
        {onAdd && <button onClick={onAdd} style={{ ...iconBtnStyle, border: `1px solid ${T.border}` }}><Plus size={13} /></button>}
      </div>
      {children}
    </div>
  );
}
function FieldLabel({ children, style }) { return <div style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 5, letterSpacing: 0.3, ...style }}>{children.toUpperCase ? children.toUpperCase() : children}</div>; }
function FieldRow({ children, style }) { return <div style={{ display: "flex", gap: 5, alignItems: "center", ...style }}>{children}</div>; }
function EmptyHint({ children }) { return <div style={{ fontSize: 11.5, color: T.textFaint, fontStyle: "italic", lineHeight: 1.5 }}>{children}</div>; }

function VisSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} title={visWord(value) || "package-private"}
      style={{ background: T.panel3, color: T.amber, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, padding: "6px 4px", fontFamily: T.mono, width: 32, flexShrink: 0, cursor: "pointer" }}>
      {VIS_OPTIONS.map((v) => <option key={v.sym} value={v.sym}>{v.sym}</option>)}
    </select>
  );
}
function inputStyle(font) { return { width: "100%", boxSizing: "border-box", background: T.panel3, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: 12.5, padding: "7px 9px", fontFamily: font || T.sans, outline: "none" }; }
function smallInput(flex) { return { flex, minWidth: 0, background: T.panel3, border: `1px solid ${T.border}`, borderRadius: 5, color: T.text, fontSize: 11.5, padding: "6px 7px", fontFamily: T.mono, outline: "none" }; }
const iconBtnStyle = { background: "transparent", border: "none", color: T.textFaint, cursor: "pointer", padding: 4, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

/* ------------------------------ CodeDrawer -------------------------------- */
function CodeDrawer({ classes, codeTab, setCodeTab, allCode, generatedByClass, language, languageOptions, onLanguageChange, onClose, onCopy, copied, onDownload, onDownloadAll, nameIssues }) {
  const current = codeTab === "all" ? allCode : generatedByClass[codeTab] || "";
  const selectedLanguage = languageOptions.find((option) => option.key === language);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,6,10,0.72)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(920px, 100%)", height: "min(680px, 100%)", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Generated {selectedLanguage.label}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <select aria-label="Programming language" value={language} onChange={(event) => onLanguageChange(event.target.value)} style={{ ...miniBtn, padding: "5px 8px" }}>
              {languageOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
            <button onClick={onCopy} style={{ ...miniBtn }}>{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}</button>
            <button onClick={onDownload} style={miniBtn}><Download size={13} /> Download</button>
            <button onClick={onDownloadAll} style={miniBtn}>All as .{selectedLanguage.extension}</button>
            <button onClick={onClose} style={iconBtnStyle}><X size={16} /></button>
          </div>
        </div>

        {nameIssues.length > 0 && (
          <div style={{ padding: "9px 16px", background: "rgba(226,104,122,0.1)", borderBottom: `1px solid ${T.border}`, fontSize: 11.5, color: T.danger }}>
            {nameIssues.map((n, i) => <div key={i}>• {n}</div>)}
          </div>
        )}

        <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, overflowX: "auto", flexShrink: 0 }}>
          <TabButton active={codeTab === "all"} onClick={() => setCodeTab("all")}>All classes</TabButton>
          {classes.map((c) => <TabButton key={c.id} active={codeTab === c.id} onClick={() => setCodeTab(c.id)}>{c.name || "Unnamed"}.{selectedLanguage.extension}</TabButton>)}
        </div>

        <pre style={{ flex: 1, margin: 0, padding: 18, overflow: "auto", fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.65, color: "#c9d1e0", background: "#0d1119" }}>
          {current || "// Nothing to generate yet — add a class first."}
        </pre>
      </div>
    </div>
  );
}
function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ fontSize: 11.5, padding: "6px 11px", borderRadius: 6, border: `1px solid ${active ? T.amber : "transparent"}`, background: active ? T.amberSoft : "transparent", color: active ? T.text : T.textDim, cursor: "pointer", fontFamily: T.mono, whiteSpace: "nowrap", flexShrink: 0 }}>
      {children}
    </button>
  );
}
const miniBtn = { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.panel2, color: T.textDim, cursor: "pointer", fontFamily: T.sans };

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: ${T.bg}; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 6px; }
      ::-webkit-scrollbar-thumb:hover { background: #333c54; }
      input:focus, select:focus { border-color: ${T.amber} !important; }
      button { transition: filter .12s, background .12s, border-color .12s; }
      button:hover { filter: brightness(1.12); }
      @keyframes pulseBorder {
        0%, 100% { box-shadow: 0 0 0 0 rgba(232,163,61,0.5); }
        50% { box-shadow: 0 0 0 6px rgba(232,163,61,0); }
      }
    `}</style>
  );
}
