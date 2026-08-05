@router.get("/pendientes/director")
def pendientes_director(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    rows = db.execute(text("""
        SELECT s.id, s.numero_radicado, s.tipo_solicitud::text, s.asunto,
               s.estado::text, s.fecha_envio, p.nombre_completo AS solicitante
        FROM solicitud s
        JOIN flujo_aprobacion fa ON fa.id_solicitud = s.id
        LEFT JOIN persona p ON p.id = s.id_solicitante
        WHERE fa.rol_responsable = 'director'
          AND fa.estado = 'pendiente'
          AND s.estado::text = 'ENVIADA'
        ORDER BY s.fecha_envio DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]

@router.get("/pendientes/coordinador")
def pendientes_coordinador(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    rows = db.execute(text("""
        SELECT s.id, s.numero_radicado, s.tipo_solicitud::text, s.asunto,
               s.estado::text, s.fecha_envio, p.nombre_completo AS solicitante
        FROM solicitud s
        JOIN flujo_aprobacion fa ON fa.id_solicitud = s.id
        LEFT JOIN persona p ON p.id = s.id_solicitante
        WHERE fa.rol_responsable = 'coordinador'
          AND fa.estado = 'pendiente'
          AND s.estado::text = 'EN_REVISION'
        ORDER BY s.fecha_envio DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]

@router.get("/pendientes/comite")
def pendientes_comite(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    _get_persona_autenticada(token, db)
    rows = db.execute(text("""
        SELECT s.id, s.numero_radicado, s.tipo_solicitud::text, s.asunto,
               s.estado::text, s.fecha_envio, p.nombre_completo AS solicitante
        FROM solicitud s
        JOIN flujo_aprobacion fa ON fa.id_solicitud = s.id
        LEFT JOIN persona p ON p.id = s.id_solicitante
        WHERE fa.rol_responsable = 'comite'
          AND fa.estado = 'pendiente'
          AND s.estado::text = 'EN_COMITE'
        ORDER BY s.fecha_envio DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]