int count = 3;
int a[1000];
int small[3] = {10, 20, 30};
int main(void) {
    count = 5;
    a[2] = 7;
    int local = 42;
    return local + count + a[2] + small[0];
}
__attribute__((import_module("wasi_snapshot_preview1"), import_name("proc_exit")))
extern void proc_exit(int code);
void _start(void) { proc_exit(main()); }
