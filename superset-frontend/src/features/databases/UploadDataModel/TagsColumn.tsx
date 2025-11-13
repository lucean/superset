import { useMemo, useState } from 'react';
import { styled, useTheme } from '@superset-ui/core';
import { Badge, Button, Select, Tooltip } from 'antd';
import TagType from 'src/types/TagType';
import { PANDAS_TYPES, PandasType, TYPE_LABELS } from './misc';

export type ColumnTag = TagType & {
  originalType: PandasType;
  effectiveType: PandasType;
  modified: boolean;
};

export type TagsColumnProps = {
  tags?: ColumnTag[];
  maxTags?: number;
  onTypeChange?: (name: string, newType: PandasType) => void;
  onResetTypes?: () => void;
  hasOverrides?: boolean;

  excludedColumns?: string[];
  onExcludedColumnsChange?: (excluded: string[]) => void;
};

const PILL_WIDTH_PX = 220;
const TYPE_CHIP_WIDTH_PX = 95;
const ACTION_CHIP_WIDTH_PX = 28;

const TagsDiv = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;
  align-items: flex-start;
`;

const FooterBar = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
`;

const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

const Pill = styled.div`
  display: flex;
  align-items: stretch;
  width: ${PILL_WIDTH_PX}px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.sizes.s};
  color: ${({ theme }) => theme.colors.grayscale.dark2};
  background: ${({ theme }) =>
    theme.colors.grayscale?.light2 || theme.colors.grayscale?.base};
  box-sizing: border-box;
  overflow: hidden;
`;

const PillName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  padding: 2px 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
`;

const TypeChip = styled.span`
  flex: 0 0 ${TYPE_CHIP_WIDTH_PX}px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  .ant-select {
    width: 100%;
  }

  .ant-select-selector {
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 8px !important;
    background: transparent !important;
    display: flex;
    align-items: center;
  }

  .ant-select-selection-item {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  .ant-select-arrow {
    font-size: 8px;
  }
`;

const ActionChip = styled.button`
  flex: 0 0 ${ACTION_CHIP_WIDTH_PX}px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  outline: none;
  padding: 0;
  line-height: 1;
  font-size: 12px;

  &:hover {
    background: ${({ theme }) =>
      theme.colors.grayscale?.light3 ||
      theme.colors.grayscale?.light2 ||
      theme.colors.grayscale?.base};
  }
`;

const ControlPill = styled(Pill)`
  cursor: pointer;
  user-select: none;
`;

const getTypeColor = (type: PandasType | undefined, theme: any): string => {
  const { colors } = theme;
  const fallback =
    colors.grayscale?.light3 ||
    colors.grayscale?.light2 ||
    colors.grayscale?.base ||
    '#e0e0e0';

  const map: Record<PandasType, string> = {
    int64: colors.success?.light2 || fallback,
    float64: colors.primary?.light2 || fallback,
    bool: colors.warning?.light2 || fallback,
    string: colors.secondary?.light2 || fallback,
    object: colors.info?.light2 || fallback,
    'datetime64[ns]': colors.error?.light2 || fallback,
    null: fallback,
  };

  return type ? map[type] || fallback : fallback;
};

const TagsColumn = ({
  tags = [],
  maxTags,
  onTypeChange,
  onResetTypes,
  hasOverrides = false,
  excludedColumns,
  onExcludedColumnsChange,
}: TagsColumnProps) => {
  const theme = useTheme();

  // When defined, we show `visibleCount - 1` tags and a `+N...` pill.
  // When undefined, we show all tags and a simple `...` pill.
  const [visibleCount, setVisibleCount] = useState<number | undefined>(maxTags);

  const excludedSet = useMemo(
    () => new Set(excludedColumns ?? []),
    [excludedColumns],
  );

  const isCollapsed = useMemo(
    () => (visibleCount ? tags.length > visibleCount : false),
    [tags.length, visibleCount],
  );

  const visibleTags = useMemo(
    () => (visibleCount ? tags.slice(0, visibleCount - 1) : tags),
    [tags, visibleCount],
  );

  const hiddenCount = useMemo(
    () => (visibleCount ? tags.length - visibleCount + 1 : 0),
    [tags.length, visibleCount],
  );

  const toggleCollapse = () =>
    setVisibleCount(current => (current ? undefined : maxTags));

  const setExcluded = (name: string, excluded: boolean) => {
    if (!onExcludedColumnsChange) return;
    const next = new Set(excludedSet);
    if (excluded) next.add(name);
    else next.delete(name);
    onExcludedColumnsChange(Array.from(next));
  };

  const onActionKey = (
    e: React.KeyboardEvent,
    name: string,
    isExcluded: boolean,
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExcluded(name, !isExcluded);
    }
  };

  return (
    <TagsDiv className="tag-list">
      {visibleTags.map(tag => {
        const { id, name, effectiveType, modified } = tag;
        const key = id != null ? String(id) : name;
        const isExcluded = excludedSet.has(name);

        const pill = (
          <Pill style={isExcluded ? { opacity: 0.5 } : undefined}>
            <PillName
              title={name}
              style={
                isExcluded ? { textDecoration: 'line-through' } : undefined
              }
            >
              {name}
            </PillName>
            <TypeChip
              style={{ backgroundColor: getTypeColor(effectiveType, theme) }}
            >
              <Select<PandasType>
                size="small"
                bordered={false}
                dropdownMatchSelectWidth={false}
                value={effectiveType}
                disabled={isExcluded}
                onChange={value => onTypeChange?.(name, value)}
              >
                {PANDAS_TYPES.map(t => (
                  <Select.Option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </Select.Option>
                ))}
              </Select>
            </TypeChip>
            {onExcludedColumnsChange && (
              <Tooltip title={isExcluded ? 'Include column' : 'Exclude column'}>
                <ActionChip
                  type="button"
                  aria-label={
                    isExcluded ? `Include ${name}` : `Exclude ${name}`
                  }
                  aria-pressed={isExcluded}
                  onClick={e => {
                    e.stopPropagation();
                    setExcluded(name, !isExcluded);
                  }}
                  onKeyDown={e => onActionKey(e, name, isExcluded)}
                >
                  {isExcluded ? '✓' : '×'}
                </ActionChip>
              </Tooltip>
            )}
          </Pill>
        );

        return (
          <RowWrapper key={key}>
            {modified ? (
              <Badge dot color="processing" offset={[-4, 0]}>
                {pill}
              </Badge>
            ) : (
              pill
            )}
          </RowWrapper>
        );
      })}

      {maxTags && tags.length > maxTags && (
        <RowWrapper>
          <ControlPill onClick={toggleCollapse}>
            <PillName>{isCollapsed ? `+${hiddenCount}...` : '...'}</PillName>
          </ControlPill>
        </RowWrapper>
      )}

      <FooterBar>
        <Button size="small" onClick={onResetTypes} disabled={!hasOverrides}>
          Reset
        </Button>
      </FooterBar>
    </TagsDiv>
  );
};

export default TagsColumn;
