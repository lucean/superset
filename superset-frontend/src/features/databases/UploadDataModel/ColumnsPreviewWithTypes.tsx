import { FC, useMemo, useState } from 'react';
import { styled, t } from '@superset-ui/core';
import TagsColumn, { ColumnTag } from './TagsColumn';
import { PandasType } from './misc';

interface ColumnsPreviewWithTypeProps {
  schema: Record<string, PandasType>;
  maxColumnsToShow?: number;
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
  maxColumnsToShow = 4,
}) => {
  const [overrides, setOverrides] = useState<Record<string, PandasType>>({});
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);

  const tags: ColumnTag[] = useMemo(
    () =>
      Object.entries(schema).map(([name, originalType]) => {
        const override = overrides[name];
        const effectiveType = override ?? originalType;
        const modified = override !== undefined && override !== originalType;
        return {
          name,
          type: effectiveType, // TagType.type
          originalType,
          effectiveType,
          modified,
        };
      }),
    [schema, overrides],
  );

  const handleTypeChange = (name: string, newType: PandasType) => {
    setOverrides(prev => ({ ...prev, [name]: newType }));
  };

  const handleResetTypes = () => setOverrides({});
  const hasOverrides = tags.some(tag => tag.modified);

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
          onExcludedColumnsChange={setExcludedColumns}
          onTypeChange={handleTypeChange}
          onResetTypes={handleResetTypes}
          hasOverrides={hasOverrides}
        />
      )}
    </StyledDivContainer>
  );
};

export default ColumnsPreviewWithType;
