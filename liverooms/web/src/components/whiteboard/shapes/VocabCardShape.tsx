import type { SyntheticEvent } from 'react';
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  RecordProps,
  T,
  TLBaseShape,
  resizeBox,
} from 'tldraw';

export type VocabDialect = 'common' | 'yerevan' | 'gyumri' | 'slang';

export type VocabCardShape = TLBaseShape<
  'vocab-card',
  {
    w: number;
    h: number;
    wordHy: string;
    translit: string;
    translationRu: string;
    dialect: VocabDialect;
    authorName: string;
  }
>;

export class VocabCardShapeUtil extends BaseBoxShapeUtil<VocabCardShape> {
  static override type = 'vocab-card' as const;
  static override props: RecordProps<VocabCardShape> = {
    w: T.number,
    h: T.number,
    wordHy: T.string,
    translit: T.string,
    translationRu: T.string,
    dialect: T.literalEnum('common', 'yerevan', 'gyumri', 'slang'),
    authorName: T.string,
  };

  getDefaultProps(): VocabCardShape['props'] {
    return {
      w: 240,
      h: 160,
      wordHy: 'Բարև',
      translit: 'barev',
      translationRu: 'привет',
      dialect: 'common',
      authorName: '',
    };
  }

  override canEdit = () => true;

  component(shape: VocabCardShape) {
    const { wordHy, translit, translationRu, authorName, w, h } = shape.props;
    const editor = this.editor;
    const editing = editor.getEditingShapeId() === shape.id;

    const stop = (e: SyntheticEvent) => e.stopPropagation();

    const patch = (partial: Partial<VocabCardShape['props']>) => {
      editor.updateShape({
        id: shape.id,
        type: 'vocab-card',
        props: { ...shape.props, ...partial },
      });
    };

    return (
      <HTMLContainer
        style={{ width: w, height: h, pointerEvents: 'all' }}
        className="vc-card"
      >
        {/* C-254: no dialect badge / type picker on the card */}
        {editing ? (
          <div className="vc-edit" onPointerDown={stop} onClick={stop}>
            <input
              className="vc-input vc-input--hy"
              defaultValue={wordHy}
              onBlur={(e) => patch({ wordHy: e.target.value })}
              onPointerDown={stop}
            />
            <input
              className="vc-input"
              defaultValue={translit}
              onBlur={(e) => patch({ translit: e.target.value })}
              onPointerDown={stop}
            />
            <input
              className="vc-input"
              defaultValue={translationRu}
              onBlur={(e) => patch({ translationRu: e.target.value })}
              onPointerDown={stop}
            />
          </div>
        ) : (
          <>
            <p className="vc-hy">{wordHy}</p>
            <p className="vc-translit">{translit}</p>
            <p className="vc-ru">{translationRu}</p>
            {authorName ? (
              <p className="vc-author">{authorName}</p>
            ) : null}
          </>
        )}
      </HTMLContainer>
    );
  }

  indicator(shape: VocabCardShape) {
    return (
      <rect width={shape.props.w} height={shape.props.h} rx={12} ry={12} />
    );
  }

  override onResize = (
    shape: VocabCardShape,
    info: Parameters<BaseBoxShapeUtil<VocabCardShape>['onResize']>[1],
  ) => resizeBox(shape, info);
}
