import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sortBySizeProperty } from "@/lib/sizeUtils";

interface Article {
  id: string;
  name: string;
  code: string;
}

interface ArticleVariation {
  id: string;
  article_id: string;
  color: string;
  size: string;
  qty_order: number;
  cutting: number;
  application1: number;
  application2: number;
  sewing: number;
  finishing: number;
  qc: number;
  shipping: number;
}

interface GroupedVariations {
  [articleId: string]: {
    article: Article;
    variations: ArticleVariation[];
    totals: {
      qty_order: number;
      cutting: number;
      application1: number;
      application2: number;
      sewing: number;
      finishing: number;
      qc: number;
      shipping: number;
    };
  };
}

interface ArticleVariationsTableProps {
  groupedVariations: GroupedVariations;
  searchTerm?: string;
}

export function ArticleVariationsTable({ groupedVariations, searchTerm = "" }: ArticleVariationsTableProps) {

  const filteredVariations = Object.entries(groupedVariations).filter(([, data]) =>
    data.article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.article.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.variations.some(variation => 
      variation.color.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Helper function to display value or dash
  const displayValue = (value: number | null | undefined): string => {
    return (value == null || value === 0) ? "-" : value.toString();
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Article Variations</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[80px]">
                    Color
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[60px]">
                    Size
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[80px] text-right">
                    Qty Order
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[70px] text-right">
                    Cutting
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[60px] text-right">
                    App1
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[60px] text-right">
                    App2
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[70px] text-right">
                    Sewing
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[80px] text-right">
                    Finishing
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[60px] text-right">
                    QC
                  </TableHead>
                  <TableHead className="font-bold text-xs sm:text-sm p-2 sm:p-3 w-[70px] text-right">
                    Shipping
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                      No article variations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVariations.flatMap(([articleId, data]) => {
                    const sortedVariations = sortBySizeProperty(data.variations);
                    
                    return [
                      // Article separator row
                      <TableRow key={`${articleId}-header`} className="bg-muted/30 border-b border-border">
                        <TableCell colSpan={10} className="p-2 sm:p-3 font-semibold text-sm">
                          {data.article.name}
                        </TableCell>
                      </TableRow>,
                      // Variation rows
                      ...sortedVariations.map((variation, index) => (
                        <TableRow key={variation.id} className={`border-b border-border/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/5'}`}>
                          <TableCell className="p-2 sm:p-3 text-xs sm:text-sm">
                            {variation.color}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm p-2 sm:p-3">
                            {variation.size || "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.qty_order)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.cutting)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.application1)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.application2)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.sewing)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.finishing)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.qc)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-3">
                            {displayValue(variation.shipping)}
                          </TableCell>
                        </TableRow>
                      ))
                    ];
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}