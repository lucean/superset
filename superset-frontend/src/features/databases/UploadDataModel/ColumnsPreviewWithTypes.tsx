import { FC, useMemo } from 'react';
import { styled, t } from '@superset-ui/core';
import TagsColumn, { ColumnTag } from './TagsColumn';
import { PandasType, TagsColumnRefs } from './misc';

interface ColumnsPreviewWithTypeProps {
  schema: Record<string, PandasType>;
  columnTypeOverrides: Record<string, PandasType>;
  excludedColumns: string[];
  onColumnTypeOverridesChange: (overrides: Record<string, PandasType>) => void;
  onExcludedColumnsChange: (excludedColumn: string[]) => void;
  maxColumnsToShow?: number;
  refs: TagsColumnRefs;
}

export const StyledDivContainer = styled.div``;

const SecondaryText = styled.span`
  color: ${({ theme }) => theme.colors.grayscale.base};
  opacity: 0.65;
  font-size: ${({ theme }) => theme.typography.sizes.s};
  margin-bottom: 4px;
  display: inline-block;
`;

const ColumnsPreviewWithType: FC<ColumnsPreviewWithTypeProps> = ({
  schema,
  columnTypeOverrides,
  excludedColumns,
  onColumnTypeOverridesChange,
  onExcludedColumnsChange,
  maxColumnsToShow = 4,
  refs,
}) => {
  const tags: ColumnTag[] = useMemo(
    () =>
      Object.entries(schema).map(([name, originalType]) => {
        const override = columnTypeOverrides[name];
        const effectiveType = override ?? originalType;
        const modified = override !== undefined && override !== originalType;
        return {
          name,
          type: effectiveType,
          originalType,
          effectiveType,
          modified,
        };
      }),
    [schema, columnTypeOverrides],
  );

  const handleTypeChange = (name: string, newType: PandasType) => {
    onColumnTypeOverridesChange({
      ...columnTypeOverrides,
      [name]: newType,
    });
  };

  const handleResetTypes = () => {
    onColumnTypeOverridesChange({});
    onExcludedColumnsChange([]);
  };

  const hasOverrides =
    tags.some(tag => tag.modified) || excludedColumns.length !== 0;

  return (
    <StyledDivContainer>
      <SecondaryText>Columns:</SecondaryText>
      {tags.length === 0 ? (
        <p className="help-block">{t('Upload file to preview columns')}</p>
      ) : (
        <TagsColumn
          tags={tags}
          maxTags={maxColumnsToShow}
          excludedColumns={excludedColumns}
          onExcludedColumnsChange={onExcludedColumnsChange}
          onTypeChange={handleTypeChange}
          onReset={handleResetTypes}
          hasOverrides={hasOverrides}
          refs={refs}
        />
      )}
    </StyledDivContainer>
  );
};

export default ColumnsPreviewWithType;
