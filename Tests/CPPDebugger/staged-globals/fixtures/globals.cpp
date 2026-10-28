const int MAXN = 1000;
const int NEG = -150;
const unsigned BIG = 4000000000U;
constexpr bool FLAG = true;
int count = 3;
int a[MAXN];
int small[3] = {10, 20, 30};
int medium[150];
int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};
int grid[2][150];
typedef int IntArray[150];
IntArray aliasArray;
namespace ns { int counter = 11; }
static bool ready = false;
double ratio = 1.5;
long long negative = -5000000000LL;
int main() {
  ::count = 5;
  a[2] = 7;
  medium[149] = 9;
  grid[1][0] = 4;
  aliasArray[1] = 8;
  ready = true;
  int local = 42;
  int count = 17;
  local += 1;
  ::count = 9;
  return local + count + ::count + a[2] + small[0] + medium[149] + matrix[1][0] + grid[1][0] + aliasArray[1] + ns::counter + ready + (int)ratio + (int)negative + MAXN + NEG + (int)BIG + FLAG;
}
