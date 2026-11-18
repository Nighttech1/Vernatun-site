type Props = {
  open: boolean;
  onClose: () => void;
};

export function CampusRulesModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="campus-rules-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="campus-rules-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="campus-rules-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="campus-rules-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
        <h2 id="campus-rules-title" className="campus-rules-modal-title">
          Культура и правила общения в Кампусе
        </h2>
        <div className="campus-rules-modal-body">
          <section>
            <h3>Ошибаться — нормально и полезно.</h3>
            <p>
              Мы здесь ради живой практики, а не экзаменов. Не бойтесь путать
              окончания, забывать слова или ошибаться в произношении — ошибки
              помогают расти.
            </p>
          </section>
          <section>
            <h3>Взаимное уважение и табу на оскорбления.</h3>
            <p>
              В эфире и чате полностью исключены токсичность, мат, насмешки над
              чужим уровнем владения языком и переход на личности. Мы общаемся
              тепло и поддерживаем собеседника, а не оцениваем его.
            </p>
          </section>
          <section>
            <h3>Чистота и культура работы на общей доске.</h3>
            <p>
              Интерактивная доска — наше общее учебное пространство. На ней
              категорически запрещены непристойные рисунки, провокационные
              надписи, спам стикерами и намеренная порча учебников или чужих
              заметок. Пользуйтесь инструментами бережно.
            </p>
          </section>
          <section>
            <h3>Делимся эфиром и тишиной.</h3>
            <p>
              Давайте другим закончить мысль, не перебивайте и держите микрофон
              выключенным, когда говорит кто-то другой, чтобы лишние шумы и эхо
              не мешали выступающему.
            </p>
          </section>
          <section>
            <h3>Личные границы и безопасность.</h3>
            <p>
              Уважайте приватность окружающих: не навязывайте нежелательное
              общение и берегите свои персональные данные. Комнаты
              модерируются, а за грубые нарушения, срыв эфиров или саботаж на
              доске доступ к комнатам ограничивается через кнопку жалобы.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
