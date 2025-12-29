import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Terms = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-muted-foreground mb-8">Última actualización: 29 de diciembre de 2024</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">1. Aceptación de los Términos</h2>
              <p className="mb-4">
                Al descargar, instalar, acceder o utilizar la aplicación móvil URBANZ (en adelante, "la Aplicación"), 
                usted acepta quedar vinculado por estos Términos y Condiciones de Uso. Si no está de acuerdo con 
                alguna parte de estos términos, no debe utilizar la Aplicación.
              </p>
              <p>
                Estos términos constituyen un acuerdo legal vinculante entre usted (el "Usuario") y URBANZ 
                (el "Proveedor"). Nos reservamos el derecho de modificar estos términos en cualquier momento, 
                notificando los cambios a través de la Aplicación o por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">2. Descripción del Servicio</h2>
              <p className="mb-4">
                URBANZ es una aplicación de gamificación deportiva que permite a los usuarios:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Registrar sus actividades de running y carrera mediante GPS</li>
                <li>Conquistar territorios virtuales basados en sus rutas de carrera</li>
                <li>Competir en ligas y clasificaciones con otros usuarios</li>
                <li>Formar y unirse a clanes para competiciones grupales</li>
                <li>Participar en desafíos individuales y colectivos</li>
                <li>Ganar puntos, logros y recompensas virtuales</li>
                <li>Interactuar con otros usuarios de la comunidad</li>
              </ul>
              <p>
                El servicio requiere acceso a la ubicación GPS del dispositivo durante las actividades 
                deportivas para su correcto funcionamiento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">3. Requisitos de Uso</h2>
              <h3 className="text-lg font-medium text-foreground mb-3">3.1 Edad Mínima</h3>
              <p className="mb-4">
                Debe tener al menos 16 años para crear una cuenta y utilizar URBANZ. Los usuarios menores 
                de 18 años deben contar con el consentimiento de sus padres o tutores legales.
              </p>
              
              <h3 className="text-lg font-medium text-foreground mb-3">3.2 Cuenta de Usuario</h3>
              <p className="mb-4">
                Para acceder a todas las funcionalidades, debe crear una cuenta proporcionando información 
                veraz y actualizada. Usted es responsable de mantener la confidencialidad de sus credenciales 
                de acceso y de todas las actividades que ocurran bajo su cuenta.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">3.3 Dispositivo Compatible</h3>
              <p>
                La Aplicación requiere un dispositivo móvil con GPS, conexión a Internet y un sistema 
                operativo compatible (iOS 14+ o Android 8+).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">4. Normas de Conducta</h2>
              <p className="mb-4">Al utilizar URBANZ, usted se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>No crear cuentas falsas o suplantar la identidad de terceros</li>
                <li>No manipular datos de GPS o falsificar actividades deportivas</li>
                <li>No utilizar software de terceros para obtener ventajas injustas</li>
                <li>No acosar, intimidar o molestar a otros usuarios</li>
                <li>No publicar contenido ofensivo, ilegal o inapropiado</li>
                <li>No intentar hackear, interferir o dañar los sistemas de la Aplicación</li>
                <li>Respetar las normas de tráfico y seguridad vial durante sus carreras</li>
                <li>No invadir propiedad privada para conquistar territorios</li>
              </ul>
              <p>
                El incumplimiento de estas normas puede resultar en la suspensión temporal o permanente 
                de su cuenta, sin derecho a reembolso o compensación.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">5. Sistema de Territorios y Puntuación</h2>
              <h3 className="text-lg font-medium text-foreground mb-3">5.1 Conquista de Territorios</h3>
              <p className="mb-4">
                Los territorios se generan automáticamente basándose en las rutas de carrera de los usuarios. 
                Un territorio puede ser conquistado por otro usuario si este corre por la misma zona con un 
                ritmo (pace) igual o mejor que el ritmo registrado del propietario actual.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">5.2 Sistema de Ligas</h3>
              <p className="mb-4">
                Los usuarios compiten en ligas semanales basadas en puntos acumulados. Las ligas incluyen: 
                Bronce, Plata, Oro, Platino, Diamante y Leyenda. Al final de cada temporada, los usuarios 
                pueden ascender o descender según su clasificación.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">5.3 Temporadas</h3>
              <p>
                Las temporadas tienen una duración determinada (generalmente mensual). Al finalizar cada 
                temporada, los puntos de temporada se reinician, aunque se mantiene un registro histórico 
                de logros y estadísticas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">6. Propiedad Intelectual</h2>
              <p className="mb-4">
                Todos los derechos de propiedad intelectual de la Aplicación, incluyendo pero no limitado a: 
                código fuente, diseño, gráficos, iconos, logotipos, textos y la marca URBANZ, son propiedad 
                exclusiva del Proveedor o sus licenciantes.
              </p>
              <p className="mb-4">
                Se le concede una licencia limitada, no exclusiva, no transferible y revocable para utilizar 
                la Aplicación para fines personales y no comerciales.
              </p>
              <p>
                El contenido generado por los usuarios (nombres de usuario, fotos de perfil, comentarios) 
                sigue siendo propiedad del usuario, pero al publicarlo en URBANZ, otorga al Proveedor una 
                licencia mundial, libre de regalías, para usar, modificar y mostrar dicho contenido en 
                relación con el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">7. Limitación de Responsabilidad</h2>
              <h3 className="text-lg font-medium text-foreground mb-3">7.1 Uso Bajo Su Propio Riesgo</h3>
              <p className="mb-4">
                El uso de URBANZ para actividades deportivas se realiza bajo su propia responsabilidad. 
                Antes de comenzar cualquier programa de ejercicio, consulte con un profesional médico, 
                especialmente si tiene condiciones de salud preexistentes.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">7.2 Seguridad Personal</h3>
              <p className="mb-4">
                Usted es el único responsable de su seguridad mientras utiliza la Aplicación. Esto incluye:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Prestar atención al tráfico y al entorno durante las carreras</li>
                <li>No correr en áreas peligrosas o restringidas</li>
                <li>Usar equipamiento adecuado y visible, especialmente de noche</li>
                <li>Mantenerse hidratado y no exceder sus límites físicos</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">7.3 Exclusión de Garantías</h3>
              <p>
                La Aplicación se proporciona "tal cual" y "según disponibilidad". No garantizamos que el 
                servicio sea ininterrumpido, libre de errores, o que los datos de GPS sean 100% precisos. 
                En la máxima medida permitida por la ley, excluimos todas las garantías implícitas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">8. Clanes y Funciones Sociales</h2>
              <p className="mb-4">
                Los clanes son grupos de usuarios que compiten juntos. Al unirse o crear un clan, acepta:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Respetar las normas internas del clan establecidas por sus líderes</li>
                <li>No utilizar el chat del clan para spam, publicidad o contenido inapropiado</li>
                <li>Que los líderes del clan tienen autoridad para expulsar miembros</li>
                <li>Que las disputas internas del clan no son responsabilidad del Proveedor</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">9. Modificaciones del Servicio</h2>
              <p className="mb-4">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del 
                servicio en cualquier momento, incluyendo:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Cambios en el sistema de puntuación y mecánicas de juego</li>
                <li>Ajustes en los límites de territorios y zonas</li>
                <li>Modificaciones en la estructura de ligas y temporadas</li>
                <li>Actualizaciones de la interfaz y funcionalidades</li>
              </ul>
              <p>
                Los cambios significativos serán notificados con antelación razonable cuando sea posible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">10. Terminación</h2>
              <p className="mb-4">
                Usted puede eliminar su cuenta en cualquier momento desde la configuración de la Aplicación. 
                Al hacerlo, se eliminarán sus datos personales según nuestra Política de Privacidad.
              </p>
              <p>
                Podemos suspender o terminar su cuenta si viola estos términos, sin previo aviso. 
                En caso de terminación, perderá acceso a todos los datos, territorios, puntos y logros 
                asociados a su cuenta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">11. Ley Aplicable y Jurisdicción</h2>
              <p className="mb-4">
                Estos términos se regirán e interpretarán de acuerdo con las leyes de España. Cualquier 
                disputa que surja en relación con estos términos estará sujeta a la jurisdicción exclusiva 
                de los tribunales de Madrid, España.
              </p>
              <p>
                Para usuarios de la Unión Europea: Estos términos no afectan a los derechos que le 
                corresponden como consumidor bajo la legislación europea aplicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">12. Disposiciones Generales</h2>
              <p className="mb-4">
                Si alguna disposición de estos términos se considera inválida o inaplicable, las demás 
                disposiciones seguirán en pleno vigor y efecto.
              </p>
              <p className="mb-4">
                El hecho de que no ejerzamos o hagamos valer algún derecho o disposición de estos términos 
                no constituirá una renuncia a dicho derecho o disposición.
              </p>
              <p>
                Estos términos, junto con la Política de Privacidad, constituyen el acuerdo completo 
                entre usted y el Proveedor con respecto al uso de URBANZ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">13. Contacto</h2>
              <p className="mb-4">
                Para cualquier pregunta, comentario o reclamación sobre estos Términos y Condiciones, 
                puede contactarnos a través de:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> legal@urbanz.app</li>
                <li><strong>Soporte en la app:</strong> Perfil → Ayuda → Contacto</li>
              </ul>
            </section>

            <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Al utilizar URBANZ, confirma que ha leído, entendido y aceptado estos Términos y Condiciones 
                en su totalidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
