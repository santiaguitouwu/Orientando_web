"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import ProductModal, { type ProductNode, type ProfesionalAsignado } from "./ProductModal";
import AssignProfessionalModal from "./AssignProfessionalModal";

interface AreaNode extends ProductNode {
  children?: SubAreaNode[];
  childrenLoaded?: boolean;
  loadingChildren?: boolean;
}

interface SubAreaNode extends ProductNode {
  children?: ProductNode[];
  childrenLoaded?: boolean;
  loadingChildren?: boolean;
}

interface ModalState {
  mode: "create" | "edit";
  nivel: 1 | 2 | 3;
  parentId?: number;
  parentName?: string;
  product?: ProductNode;
}

function ProfesionalesList({ profesionales }: { profesionales: ProfesionalAsignado[] }) {
  if (!profesionales?.length) return null;
  return (
    <div className="px-lg pb-md pt-xs border-t border-outline-variant/40 bg-surface-container-lowest">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
        Profesionales asignados
      </p>
      <div className="flex flex-wrap gap-xs">
        {profesionales.map((p) => (
          <span
            key={p.profesional_id}
            className="inline-flex items-center gap-xs px-sm py-0.5 rounded-full bg-secondary-container/30 text-on-surface font-body-sm text-body-sm border border-secondary/20"
          >
            <span className="material-symbols-outlined text-[13px] text-secondary">person</span>
            {p.nombres} {p.apellidos}
            <span className="text-on-surface-variant">· {p.cargo}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedL1, setExpandedL1] = useState<Set<number>>(new Set());
  const [expandedL2, setExpandedL2] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<ModalState | null>(null);
  const [assignProduct, setAssignProduct] = useState<ProductNode | null>(null);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<ProductNode[]>("/api/products/categories?level=1");
      setAreas(res.data.map((a) => ({ ...a, childrenLoaded: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar áreas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  async function toggleArea(area: AreaNode) {
    const isOpen = expandedL1.has(area.id);
    if (isOpen) {
      setExpandedL1((prev) => { const s = new Set(prev); s.delete(area.id); return s; });
      return;
    }
    setExpandedL1((prev) => new Set(prev).add(area.id));
    if (area.childrenLoaded) return;

    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, loadingChildren: true } : a));
    try {
      const res = await apiRequest<ProductNode[]>(`/api/products/categories?level=2&parent_id=${area.id}`);
      setAreas((prev) => prev.map((a) =>
        a.id === area.id
          ? { ...a, children: res.data.map((c) => ({ ...c, childrenLoaded: false })), childrenLoaded: true, loadingChildren: false }
          : a
      ));
    } catch {
      setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, loadingChildren: false } : a));
    }
  }

  async function toggleSubArea(areaId: number, subArea: SubAreaNode) {
    const isOpen = expandedL2.has(subArea.id);
    if (isOpen) {
      setExpandedL2((prev) => { const s = new Set(prev); s.delete(subArea.id); return s; });
      return;
    }
    setExpandedL2((prev) => new Set(prev).add(subArea.id));
    if (subArea.childrenLoaded) return;

    setAreas((prev) => prev.map((a) =>
      a.id === areaId
        ? { ...a, children: a.children?.map((sa) => sa.id === subArea.id ? { ...sa, loadingChildren: true } : sa) }
        : a
    ));
    try {
      const res = await apiRequest<ProductNode[]>(`/api/products/categories?level=3&parent_id=${subArea.id}`);
      setAreas((prev) => prev.map((a) =>
        a.id === areaId
          ? {
              ...a,
              children: a.children?.map((sa) =>
                sa.id === subArea.id
                  ? { ...sa, children: res.data, childrenLoaded: true, loadingChildren: false }
                  : sa
              ),
            }
          : a
      ));
    } catch {
      setAreas((prev) => prev.map((a) =>
        a.id === areaId
          ? { ...a, children: a.children?.map((sa) => sa.id === subArea.id ? { ...sa, loadingChildren: false } : sa) }
          : a
      ));
    }
  }

  function handleSaved() {
    setModal(null);
    setExpandedL1(new Set());
    setExpandedL2(new Set());
    fetchAreas();
  }

  return (
    <>
    <div className="flex-1 overflow-y-auto p-xl space-y-xl bg-background custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-base">
          <div className="flex items-center gap-xs text-on-surface-variant">
            <span className="font-label-md text-[11px] uppercase tracking-tighter">Orientando</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-md text-[11px] uppercase tracking-tighter">Administración</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-primary">Gestión de Áreas</h2>
          <p className="text-on-surface-variant font-body-md text-body-md max-w-2xl">
            Configure las áreas, sub-áreas y servicios disponibles en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={fetchAreas}
            className="flex items-center gap-sm px-md py-sm border border-outline-variant rounded-lg text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">refresh</span>
            Actualizar
          </button>
          <button
            onClick={() => setModal({ mode: "create", nivel: 1 })}
            className="flex items-center gap-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Nueva Área
          </button>
        </div>
      </div>

      {/* Árbol */}
      <div className="space-y-md">
        {loading ? (
          <div className="flex items-center justify-center gap-sm py-xl text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Cargando áreas...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-sm py-xl text-error">
            <span className="material-symbols-outlined text-[32px]">error</span>
            <span className="font-body-md text-body-md">{error}</span>
            <button onClick={fetchAreas} className="mt-sm px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md">Reintentar</button>
          </div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center gap-md py-xl text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-[48px]">category</span>
            <p className="font-body-md text-body-md">No hay áreas configuradas.</p>
            <button
              onClick={() => setModal({ mode: "create", nivel: 1 })}
              className="px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-md text-label-md"
            >
              Crear primera área
            </button>
          </div>
        ) : (
          areas.map((area) => {
            const isOpen = expandedL1.has(area.id);
            const areaIsFinal = !area.tiene_hijos || area.profesionales?.length > 0;
            return (
              <div key={area.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                {/* Nivel 1 header */}
                <div className="flex items-center justify-between px-lg py-md hover:bg-surface-container-low/50 transition-colors">
                  <div
                    className={`flex items-center gap-md flex-1 min-w-0 ${area.tiene_hijos ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => area.tiene_hijos && toggleArea(area)}
                  >
                    {area.tiene_hijos ? (
                      <span className={`material-symbols-outlined text-secondary flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                        chevron_right
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-outline flex-shrink-0">remove</span>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-sm flex-wrap">
                        <p className="font-headline-sm text-headline-sm text-on-surface">{area.nombre}</p>
                        {areaIsFinal && (area.es_agendable_por_bot ? (
                          <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-300">
                            <span className="material-symbols-outlined text-[11px]">smart_toy</span>Chatbot
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                            <span className="material-symbols-outlined text-[11px]">smartphone</span>Manual
                          </span>
                        ))}
                      </div>
                      {area.descripcion && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{area.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-sm ml-md flex-shrink-0">
                    {!areaIsFinal && (
                      <button
                        onClick={() => setModal({ mode: "create", nivel: 2, parentId: area.id, parentName: area.nombre })}
                        className="flex items-center gap-xs px-sm py-xs rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Sub-área
                      </button>
                    )}
                    {areaIsFinal && (
                      <button
                        onClick={() => setAssignProduct(area)}
                        className="flex items-center gap-xs px-sm py-xs rounded-lg border border-secondary text-secondary font-label-sm text-label-sm hover:bg-secondary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">group_add</span>
                        Asignar
                      </button>
                    )}
                    <button
                      onClick={() => setModal({ mode: "edit", nivel: area.nivel as 1 | 2 | 3, product: area })}
                      className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>

                <ProfesionalesList profesionales={area.profesionales} />

                {/* Hijos nivel 1 */}
                {area.tiene_hijos && isOpen && (
                  <div className="border-t border-outline-variant bg-surface-container-low/30 px-lg py-md space-y-sm">
                    {area.loadingChildren ? (
                      <div className="flex items-center gap-sm py-md text-on-surface-variant font-body-sm text-body-sm pl-xl">
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Cargando sub-áreas...
                      </div>
                    ) : !area.children || area.children.length === 0 ? (
                      <div className="flex items-center justify-between py-md px-md border border-dashed border-outline-variant rounded-lg ml-lg">
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Sin sub-áreas configuradas.</p>
                        <button
                          onClick={() => setModal({ mode: "create", nivel: 2, parentId: area.id, parentName: area.nombre })}
                          className="flex items-center gap-xs px-sm py-xs rounded-lg border border-secondary text-secondary font-label-sm text-label-sm hover:bg-secondary/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Agregar
                        </button>
                      </div>
                    ) : (
                      area.children.map((subArea) => {
                        const isSubOpen = expandedL2.has(subArea.id);
                        const subIsFinal = !subArea.tiene_hijos || subArea.profesionales?.length > 0;
                        return (
                          <div key={subArea.id} className="ml-lg border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
                            {/* Nivel 2 header */}
                            <div className="flex items-center justify-between px-md py-sm hover:bg-surface-container-low/50 transition-colors">
                              <div
                                className={`flex items-center gap-sm flex-1 min-w-0 ${subArea.tiene_hijos ? "cursor-pointer" : "cursor-default"}`}
                                onClick={() => subArea.tiene_hijos && toggleSubArea(area.id, subArea)}
                              >
                                {subArea.tiene_hijos ? (
                                  <span className={`material-symbols-outlined text-[18px] text-secondary flex-shrink-0 transition-transform duration-200 ${isSubOpen ? "rotate-90" : ""}`}>
                                    chevron_right
                                  </span>
                                ) : (
                                  <span className="material-symbols-outlined text-[18px] text-outline flex-shrink-0">remove</span>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-sm flex-wrap">
                                    <p className="font-body-md text-body-md text-on-surface font-semibold">{subArea.nombre}</p>
                                    {subIsFinal && (subArea.es_agendable_por_bot ? (
                                      <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-300">
                                        <span className="material-symbols-outlined text-[11px]">smart_toy</span>Chatbot
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                                        <span className="material-symbols-outlined text-[11px]">smartphone</span>Manual
                                      </span>
                                    ))}
                                  </div>
                                  {subArea.descripcion && (
                                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subArea.descripcion}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-xs ml-md flex-shrink-0">
                                {!subIsFinal && (
                                  <button
                                    onClick={() => setModal({ mode: "create", nivel: 3, parentId: subArea.id, parentName: subArea.nombre })}
                                    className="flex items-center gap-xs px-sm py-xs rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    Sub-área
                                  </button>
                                )}
                                {subIsFinal && (
                                  <button
                                    onClick={() => setAssignProduct(subArea)}
                                    className="flex items-center gap-xs px-sm py-xs rounded-lg border border-secondary text-secondary font-label-sm text-label-sm hover:bg-secondary/5 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">group_add</span>
                                    Asignar
                                  </button>
                                )}
                                <button
                                  onClick={() => setModal({ mode: "edit", nivel: subArea.nivel as 1 | 2 | 3, product: subArea })}
                                  className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                              </div>
                            </div>

                            <ProfesionalesList profesionales={subArea.profesionales} />

                            {/* Hijos nivel 2 */}
                            {subArea.tiene_hijos && isSubOpen && (
                              <div className="border-t border-outline-variant bg-surface-container-low/30 px-md py-sm space-y-xs">
                                {subArea.loadingChildren ? (
                                  <div className="flex items-center gap-sm py-sm text-on-surface-variant font-body-sm text-body-sm pl-lg">
                                    <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                                    Cargando...
                                  </div>
                                ) : !subArea.children || subArea.children.length === 0 ? (
                                  <div className="flex items-center justify-between py-sm px-md border border-dashed border-outline-variant rounded-lg ml-lg">
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">Sin elementos configurados.</p>
                                    <button
                                      onClick={() => setModal({ mode: "create", nivel: 3, parentId: subArea.id, parentName: subArea.nombre })}
                                      className="flex items-center gap-xs px-sm py-xs rounded-lg border border-secondary text-secondary font-label-sm text-label-sm hover:bg-secondary/5 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">add</span>
                                      Agregar
                                    </button>
                                  </div>
                                ) : (
                                  subArea.children.map((service) => {
                                    const serviceIsFinal = !service.tiene_hijos || service.profesionales?.length > 0;
                                    return (
                                      <div key={service.id} className="ml-lg border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
                                        <div className="flex items-start justify-between gap-md px-md py-sm">
                                          <div className="flex items-start gap-sm flex-1 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0 mt-2" />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-sm flex-wrap">
                                                <p className="font-body-md text-body-md text-on-surface font-semibold">{service.nombre}</p>
                                                {service.es_agendable_por_bot ? (
                                                  <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-300">
                                                    <span className="material-symbols-outlined text-[11px]">smart_toy</span>
                                                    Chatbot
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-xs px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-300">
                                                    <span className="material-symbols-outlined text-[11px]">smartphone</span>
                                                    Manual
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-md mt-0.5 flex-wrap">
                                                {service.descripcion && (
                                                  <p className="font-body-sm text-body-sm text-on-surface-variant">{service.descripcion}</p>
                                                )}
                                                {service.duracion > 0 && (
                                                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
                                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                    {service.duracion} min
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-xs flex-shrink-0">
                                            {!serviceIsFinal && (
                                              <button
                                                onClick={() => setModal({ mode: "create", nivel: 3, parentId: service.id, parentName: service.nombre })}
                                                className="flex items-center gap-xs px-sm py-xs rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                              >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                                Sub-área
                                              </button>
                                            )}
                                            {serviceIsFinal && (
                                              <button
                                                onClick={() => setAssignProduct(service)}
                                                className="flex items-center gap-xs px-sm py-xs rounded-lg border border-secondary text-secondary font-label-sm text-label-sm hover:bg-secondary/5 transition-colors"
                                              >
                                                <span className="material-symbols-outlined text-[14px]">group_add</span>
                                                Asignar
                                              </button>
                                            )}
                                            <button
                                              onClick={() => setModal({ mode: "edit", nivel: service.nivel as 1 | 2 | 3, product: service })}
                                              className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
                                            >
                                              <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                          </div>
                                        </div>
                                        <ProfesionalesList profesionales={service.profesionales} />
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>

    {modal && (
      <ProductModal
        mode={modal.mode}
        nivel={modal.nivel}
        parentId={modal.parentId}
        parentName={modal.parentName}
        product={modal.product}
        onClose={() => setModal(null)}
        onSaved={handleSaved}
      />
    )}

    {assignProduct && (
      <AssignProfessionalModal
        product={assignProduct}
        onClose={() => setAssignProduct(null)}
        onSaved={() => { setAssignProduct(null); handleSaved(); }}
      />
    )}
    </>
  );
}