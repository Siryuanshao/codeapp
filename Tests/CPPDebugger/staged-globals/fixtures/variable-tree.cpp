#include <vector>
#include <string>
struct Point { int x; int y; };
class Person { public: int age; Point position; int marks[3]; };
int main() {
  Person person{25, {1, 2}, {3, 4, 5}};
  std::vector<int> numbers{10, 20, 30};
  std::string greeting = "hello";
  int large[120] = {};
  large[100] = 123;
  person.age = 26;
  person.position.x = 3;
  return person.age + numbers[0] + greeting.size() + large[100];
}
