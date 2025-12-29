import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidad</h1>
          <p className="text-muted-foreground mb-8">Última actualización: 29 de diciembre de 2024</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">1. Introducción</h2>
              <p className="mb-4">
                En URBANZ nos comprometemos a proteger su privacidad y sus datos personales. Esta Política 
                de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información 
                cuando utiliza nuestra aplicación móvil de gamificación deportiva.
              </p>
              <p className="mb-4">
                Esta política cumple con el Reglamento General de Protección de Datos (RGPD) de la Unión 
                Europea, la Ley Orgánica de Protección de Datos Personales y garantía de los derechos 
                digitales (LOPDGDD) de España, y otras normativas aplicables de protección de datos.
              </p>
              <p>
                Al utilizar URBANZ, usted consiente la recopilación y uso de información de acuerdo con 
                esta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">2. Responsable del Tratamiento</h2>
              <p className="mb-4">
                El responsable del tratamiento de sus datos personales es URBANZ.
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email de contacto:</strong> privacy@urbanz.app</li>
                <li><strong>Delegado de Protección de Datos:</strong> dpo@urbanz.app</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">3. Datos que Recopilamos</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-3">3.1 Datos de Registro</h3>
              <p className="mb-4">Cuando crea una cuenta, recopilamos:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Dirección de correo electrónico:</strong> Para la autenticación y comunicaciones</li>
                <li><strong>Nombre de usuario:</strong> Para identificarle públicamente en la aplicación</li>
                <li><strong>Contraseña:</strong> Almacenada de forma encriptada mediante hash seguro</li>
                <li><strong>Género (opcional):</strong> Para estadísticas y clasificaciones personalizadas</li>
                <li><strong>Altura (opcional):</strong> Para cálculos de métricas deportivas</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">3.2 Datos de Ubicación (GPS)</h3>
              <p className="mb-4">
                La funcionalidad principal de URBANZ requiere acceso a su ubicación GPS. Recopilamos:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Coordenadas GPS en tiempo real:</strong> Durante las sesiones de carrera activas</li>
                <li><strong>Rutas de carrera:</strong> Trazados completos de sus recorridos</li>
                <li><strong>Velocidad y ritmo:</strong> Calculados a partir de los datos de ubicación</li>
                <li><strong>Altitud:</strong> Para cálculos de desnivel</li>
              </ul>
              <p className="mb-4">
                <strong>Importante:</strong> Solo accedemos a su ubicación cuando usted inicia activamente 
                una sesión de carrera o cuando tiene activado el seguimiento en segundo plano (que puede 
                desactivar en cualquier momento). No rastreamos su ubicación de forma pasiva.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">3.3 Datos de Actividad Deportiva</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Distancia recorrida</li>
                <li>Tiempo de actividad</li>
                <li>Ritmo promedio y por segmentos</li>
                <li>Territorios conquistados y puntos ganados</li>
                <li>Histórico de carreras y estadísticas acumuladas</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">3.4 Datos de Uso de la Aplicación</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Interacciones con la interfaz</li>
                <li>Funciones utilizadas y frecuencia de uso</li>
                <li>Errores y fallos de la aplicación</li>
                <li>Tipo de dispositivo y versión del sistema operativo</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">3.5 Datos de Interacción Social</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Membresía en clanes</li>
                <li>Lista de amigos y conexiones</li>
                <li>Reacciones a actividades de otros usuarios</li>
                <li>Participación en desafíos grupales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">4. Base Legal para el Tratamiento</h2>
              <p className="mb-4">Tratamos sus datos personales basándonos en las siguientes bases legales:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Ejecución del contrato:</strong> Para proporcionar el servicio que ha solicitado al crear una cuenta</li>
                <li><strong>Consentimiento:</strong> Para el procesamiento de datos de ubicación y comunicaciones de marketing</li>
                <li><strong>Interés legítimo:</strong> Para mejorar el servicio, prevenir fraudes y garantizar la seguridad</li>
                <li><strong>Obligación legal:</strong> Para cumplir con requisitos legales aplicables</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">5. Finalidades del Tratamiento</h2>
              <p className="mb-4">Utilizamos sus datos para:</p>
              
              <h3 className="text-lg font-medium text-foreground mb-3">5.1 Provisión del Servicio</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Gestionar su cuenta de usuario</li>
                <li>Registrar y mostrar sus actividades deportivas</li>
                <li>Calcular y asignar territorios conquistados</li>
                <li>Gestionar el sistema de ligas, puntos y clasificaciones</li>
                <li>Facilitar la interacción social (clanes, amigos, reacciones)</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">5.2 Mejora del Servicio</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Analizar patrones de uso para mejorar la experiencia</li>
                <li>Detectar y corregir errores técnicos</li>
                <li>Desarrollar nuevas funcionalidades basadas en el comportamiento del usuario</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">5.3 Comunicaciones</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Enviar notificaciones sobre su cuenta y actividad</li>
                <li>Informar sobre cambios en el servicio o políticas</li>
                <li>Enviar comunicaciones de marketing (solo con su consentimiento)</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">5.4 Seguridad</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Detectar y prevenir actividades fraudulentas</li>
                <li>Verificar la autenticidad de las actividades deportivas registradas</li>
                <li>Proteger contra accesos no autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">6. Compartición de Datos</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-3">6.1 Información Pública</h3>
              <p className="mb-4">
                Por la naturaleza competitiva de URBANZ, cierta información es visible para otros usuarios:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Nombre de usuario y avatar</li>
                <li>Territorios conquistados (ubicación general, no rutas exactas)</li>
                <li>Estadísticas públicas (distancia total, puntos, logros)</li>
                <li>Posición en clasificaciones y ligas</li>
                <li>Pertenencia a clanes</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">6.2 Proveedores de Servicios</h3>
              <p className="mb-4">Compartimos datos con terceros que nos ayudan a operar el servicio:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Supabase:</strong> Infraestructura de base de datos y autenticación (servidores en la UE)</li>
                <li><strong>Mapbox:</strong> Servicios de mapas y visualización de territorios</li>
                <li><strong>Servicios de análisis:</strong> Para entender el uso de la aplicación</li>
              </ul>
              <p>
                Todos nuestros proveedores están obligados contractualmente a proteger sus datos y solo 
                pueden utilizarlos para los fines específicos acordados.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">6.3 Otros Casos</h3>
              <p className="mb-4">Podemos compartir datos cuando:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sea requerido por ley o autoridades competentes</li>
                <li>Sea necesario para proteger nuestros derechos legales</li>
                <li>En caso de fusión, adquisición o venta de activos (con previo aviso)</li>
                <li>Con su consentimiento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">7. Transferencias Internacionales</h2>
              <p className="mb-4">
                Sus datos se almacenan principalmente en servidores ubicados en la Unión Europea. 
                En caso de transferencias a países fuera del Espacio Económico Europeo, garantizamos 
                que existan salvaguardas adecuadas, como:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Decisiones de adecuación de la Comisión Europea</li>
                <li>Cláusulas contractuales tipo aprobadas por la UE</li>
                <li>Certificaciones como el Marco de Privacidad de Datos UE-EE.UU.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">8. Retención de Datos</h2>
              <p className="mb-4">Conservamos sus datos durante los siguientes períodos:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Datos de cuenta:</strong> Mientras su cuenta esté activa, más 2 años después de la eliminación</li>
                <li><strong>Datos de actividad:</strong> Indefinidamente mientras la cuenta esté activa (para históricos y estadísticas)</li>
                <li><strong>Datos de ubicación detallados:</strong> 3 años desde el registro de la actividad</li>
                <li><strong>Datos de facturación:</strong> 6 años por obligaciones fiscales</li>
                <li><strong>Logs de seguridad:</strong> 1 año</li>
              </ul>
              <p>
                Al eliminar su cuenta, anonimizamos o eliminamos sus datos personales, aunque podemos 
                conservar datos agregados y anonimizados para fines estadísticos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">9. Sus Derechos</h2>
              <p className="mb-4">Bajo el RGPD y la LOPDGDD, usted tiene derecho a:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Acceso:</strong> Obtener una copia de sus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos ("derecho al olvido")</li>
                <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos en ciertos casos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado y de uso común</li>
                <li><strong>Oposición:</strong> Oponerse al procesamiento basado en interés legítimo</li>
                <li><strong>Retirar consentimiento:</strong> En cualquier momento, sin afectar la licitud del tratamiento previo</li>
              </ul>
              <p className="mb-4">
                Para ejercer estos derechos, contacte con nosotros en privacy@urbanz.app o a través de 
                la sección de configuración de privacidad en la aplicación.
              </p>
              <p>
                También tiene derecho a presentar una reclamación ante la Agencia Española de Protección 
                de Datos (AEPD) o la autoridad de control de su país de residencia.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">10. Seguridad de los Datos</h2>
              <p className="mb-4">Implementamos medidas técnicas y organizativas para proteger sus datos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encriptación de datos en tránsito (TLS/HTTPS) y en reposo</li>
                <li>Almacenamiento seguro de contraseñas mediante algoritmos de hash modernos</li>
                <li>Autenticación de dos factores disponible</li>
                <li>Controles de acceso basados en roles para nuestro personal</li>
                <li>Monitorización continua de seguridad y detección de intrusiones</li>
                <li>Auditorías de seguridad periódicas</li>
                <li>Políticas de seguridad de la información para empleados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">11. Datos de Menores</h2>
              <p className="mb-4">
                URBANZ está dirigido a usuarios mayores de 16 años. No recopilamos intencionadamente 
                datos de menores de esta edad. Si descubrimos que hemos recopilado datos de un menor 
                sin el consentimiento parental requerido, eliminaremos esa información lo antes posible.
              </p>
              <p>
                Si usted es padre o tutor y cree que su hijo ha proporcionado datos personales, 
                contacte con nosotros en privacy@urbanz.app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">12. Cookies y Tecnologías Similares</h2>
              <p className="mb-4">
                La aplicación móvil URBANZ utiliza tecnologías de almacenamiento local para:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Mantener su sesión iniciada</li>
                <li>Almacenar preferencias de la aplicación</li>
                <li>Cachear datos para funcionamiento offline</li>
                <li>Analizar el rendimiento de la aplicación</li>
              </ul>
              <p>
                Si accede a URBANZ a través de un navegador web, utilizamos cookies esenciales para el 
                funcionamiento del servicio. Puede gestionar las cookies en la configuración de su navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">13. Cambios en esta Política</h2>
              <p className="mb-4">
                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre 
                cambios significativos mediante:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Notificación push en la aplicación</li>
                <li>Correo electrónico a la dirección asociada a su cuenta</li>
                <li>Aviso destacado al iniciar la aplicación</li>
              </ul>
              <p>
                La fecha de "última actualización" al inicio de esta política indica cuándo se realizaron 
                los cambios más recientes. Le recomendamos revisar esta política periódicamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">14. Contacto</h2>
              <p className="mb-4">
                Para cualquier pregunta, solicitud o reclamación relacionada con esta Política de Privacidad 
                o el tratamiento de sus datos personales, puede contactarnos:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email general:</strong> privacy@urbanz.app</li>
                <li><strong>Delegado de Protección de Datos:</strong> dpo@urbanz.app</li>
                <li><strong>Soporte en la app:</strong> Perfil → Ayuda → Privacidad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">15. Información Adicional</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-3">15.1 Decisiones Automatizadas</h3>
              <p className="mb-4">
                Utilizamos algoritmos automatizados para detectar actividades fraudulentas (como 
                falsificación de datos GPS). Estas decisiones pueden afectar a su cuenta (suspensión 
                o penalizaciones). Tiene derecho a solicitar revisión humana de estas decisiones.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">15.2 Perfilado</h3>
              <p>
                Analizamos sus datos de actividad para ofrecerle estadísticas personalizadas, 
                sugerencias de rutas y desafíos adaptados a su nivel. Este perfilado no tiene 
                efectos legales significativos sobre usted.
              </p>
            </section>

            <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Al utilizar URBANZ, confirma que ha leído y comprendido esta Política de Privacidad. 
                Para más información sobre cómo protegemos sus datos, no dude en contactarnos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
